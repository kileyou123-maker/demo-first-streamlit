#!/usr/bin/env python3
import csv, io, json, os, re, sys, urllib.request
from datetime import datetime, timezone

UA="ETF-XRAY/0.1 (+https://github.com/kileyou123-maker/demo-first-streamlit)"

def fetch(url, encoding="utf-8"):
    req=urllib.request.Request(url, headers={"User-Agent":UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode(encoding, errors="replace")

def clean_name(s):
    s=(s or "").strip()
    s=re.sub(r"\s+-\s+.*$", "", s)
    return s

def load_tw():
    url="https://openapi.twse.com.tw/v1/opendata/t187ap47_L"
    rows=json.loads(fetch(url))
    out=[]
    for r in rows:
        ticker=(r.get("基金代號") or "").strip()
        name=(r.get("基金簡稱") or r.get("基金中文名稱") or "").strip()
        if not ticker or not name:
            continue
        out.append({
            "ticker":ticker,
            "name":name,
            "market":"台灣",
            "exchange":"TWSE",
            "category":(r.get("基金類型") or "ETF").strip() or "ETF",
            "currency":"TWD",
            "issuer":"官方基金資料",
            "listedDate":(r.get("上市日期") or "").strip(),
            "source":"TWSE OpenAPI"
        })
    return out

def parse_pipe(text, market_default):
    lines=[x for x in text.splitlines() if x and not x.startswith("File Creation Time")]
    if not lines: return []
    reader=csv.DictReader(io.StringIO("\n".join(lines)), delimiter="|")
    out=[]
    for r in reader:
        if (r.get("ETF") or "").strip().upper()!="Y": continue
        if (r.get("Test Issue") or "").strip().upper()=="Y": continue
        ticker=(r.get("Symbol") or r.get("ACT Symbol") or "").strip()
        name=(r.get("Security Name") or "").strip()
        if not ticker or not name: continue
        exch=(r.get("Exchange") or market_default).strip()
        out.append({
            "ticker":ticker,
            "name":clean_name(name),
            "market":"美國",
            "exchange":exch or market_default,
            "category":"ETF",
            "currency":"USD",
            "issuer":"",
            "source":"Nasdaq Trader Symbol Directory"
        })
    return out

def load_us():
    base="https://www.nasdaqtrader.com/dynamic/SymDir/"
    out=[]
    for fn,ex in [("nasdaqlisted.txt","NASDAQ"),("otherlisted.txt","US")]:
        try:
            out.extend(parse_pipe(fetch(base+fn, encoding="utf-8"), ex))
        except Exception as e:
            print("warning:", fn, e, file=sys.stderr)
    return out

def dedupe(rows):
    seen={}
    for x in rows:
        k=(x["market"],x["ticker"].upper())
        if k not in seen or (seen[k].get("name","")=="" and x.get("name")):
            seen[k]=x
    return sorted(seen.values(), key=lambda x:(x["market"],x["ticker"]))

def main():
    rows=[]
    errors=[]
    for label,fn in [("TWSE",load_tw),("US",load_us)]:
        try:
            part=fn()
            rows.extend(part)
            print(label, len(part))
        except Exception as e:
            errors.append(f"{label}: {e}")
    rows=dedupe(rows)
    payload={
        "generatedAt":datetime.now(timezone.utc).isoformat(),
        "count":len(rows),
        "markets":{
            "台灣":sum(1 for x in rows if x["market"]=="台灣"),
            "美國":sum(1 for x in rows if x["market"]=="美國")
        },
        "errors":errors,
        "funds":rows
    }
    os.makedirs("etf-xray", exist_ok=True)
    with open("etf-xray/catalog.json","w",encoding="utf-8") as f:
        json.dump(payload,f,ensure_ascii=False,separators=(",",":"))
    print("total",len(rows),"errors",errors)

if __name__=="__main__":
    main()
