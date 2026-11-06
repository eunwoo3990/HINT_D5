"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, ClipboardList, Clock3, FileText, Filter, LayoutDashboard, Package, Search, ShieldCheck, Truck, Upload, XCircle } from "lucide-react";
import { plans, Plan, Status } from "./data";

const statusClass = (s:Status) => s === "승인" ? "approved" : s === "보류" ? "hold" : "rejected";
const StatusPill = ({status}:{status:Status}) => <span className={`status ${statusClass(status)}`}>{status==="승인" ? <CheckCircle2 size={12}/> : status==="보류" ? <Clock3 size={12}/> : <XCircle size={12}/>} {status}</span>;

export default function Home() {
  const [selected,setSelected] = useState<Plan|null>(null);
  const [filter,setFilter] = useState("전체");
  const [search,setSearch] = useState("");
  const [expanded,setExpanded] = useState("1");
  const [toast,setToast] = useState("");
  const [view,setView] = useState("검토 대시보드");
  const [analysisInput,setAnalysisInput] = useState("");
  const [analysisResult,setAnalysisResult] = useState("");
  const [analysisError,setAnalysisError] = useState("");
  const [analysisBusy,setAnalysisBusy] = useState(false);
  const [analysisModel,setAnalysisModel] = useState("");

  const filtered = useMemo(()=>plans.filter(p=>(filter==="전체" || p.status===filter) && (p.title+p.id+p.plant+p.line).toLowerCase().includes(search.toLowerCase())),[filter,search]);
  const counts = {all:plans.length,approved:plans.filter(p=>p.status==="승인").length,hold:plans.filter(p=>p.status==="보류").length,rejected:plans.filter(p=>p.status==="불가").length};
  const notify = (message:string) => { setToast(message); window.setTimeout(()=>setToast(""),2800); };
  const runGeminiAnalysis = async () => {
    setAnalysisError(""); setAnalysisResult(""); setAnalysisBusy(true);
    try {
      const response = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({content:analysisInput}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "분석 요청에 실패했습니다.");
      setAnalysisResult(data.analysis); setAnalysisModel(data.model || "Gemini");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally { setAnalysisBusy(false); }
  };
  const loadTextFile = async (file?:File) => {
    if (!file) return;
    setAnalysisInput((await file.text()).slice(0,24000));
    setAnalysisError(""); setAnalysisResult("");
  };
  const decide = (label:string) => { notify(`'${selected?.id}' ${label} 처리 의견이 기록되었습니다. (시연용)`); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><div><div className="brand-title">MATERIAL OPS</div><div className="brand-sub">INTELLIGENT REVIEW</div></div></div>
      <nav><div className="nav-label">WORKSPACE</div>
        <button className={`nav-item ${!selected?"active":""}`} onClick={()=>{setSelected(null);setView("검토 대시보드");}}><LayoutDashboard size={16}/> 검토 대시보드</button>
        <button className="nav-item" onClick={()=>notify("운영계획 목록을 표시하고 있습니다.")}><ClipboardList size={16}/> 운영계획 목록</button>
        <button className="nav-item" onClick={()=>notify("설비 특성표 데이터로 구성된 시연 화면입니다.")}><Package size={16}/> 자재·재고 현황</button>
        <button className="nav-item" onClick={()=>notify("설비 운용계획 데이터로 구성된 시연 화면입니다.")}><Truck size={16}/> 물류 설비 현황</button>
        <div className="nav-label">MANAGEMENT</div>
        <button className="nav-item" onClick={()=>notify("검토 이력은 본 데모에서 세션 내 처리 결과만 표시합니다.")}><Activity size={16}/> 검토 이력</button>
        <button className="nav-item" onClick={()=>notify("기준 설정 기능은 MVP 확장 항목입니다.")}><ShieldCheck size={16}/> 검토 기준 설정</button>
      </nav>
      <div className="sidebar-bottom"><div className="profile"><div className="avatar">관</div><div><div className="profile-name">운영관리 담당자</div><div className="profile-role">MATERIAL MANAGER</div></div></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">MATERIAL OPS　/　<b>{selected ? "자재운반 설비 상세 검토" : view}</b></div><div className="top-actions"><span className="env-pill">DEMO ENVIRONMENT</span><Bell size={17} color="#8793a3"/></div></header>
      <div className="content">
        {!selected ? <>
          <div className="panel" style={{marginBottom:18}}>
            <div className="panel-head"><div><div className="panel-title">Gemini AI 실자료 분석</div><div className="panel-sub">자재운반 설비 특성표·운용계획서 내용을 입력하거나 텍스트 파일을 불러와 실제 Gemini API로 분석합니다.</div></div><span className="env-pill">GEMINI FREE TIER</span></div>
            <textarea value={analysisInput} onChange={e=>setAnalysisInput(e.target.value)} placeholder="설비 특성표 또는 운용계획서의 텍스트를 붙여넣으세요. 자재명, 운반 경로, 설비 종류, 정격하중, 처리능력, 대수, 배차 시간, 점검·정비 조건..." rows={7} style={{width:"100%",border:"1px solid #dbe2ea",borderRadius:8,padding:12,fontSize:12,lineHeight:1.6,resize:"vertical",fontFamily:"inherit"}} />
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:10}}>
              <label className="secondary-btn" style={{display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer"}}><Upload size={14}/> 텍스트 파일 불러오기<input type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={e=>loadTextFile(e.target.files?.[0])} style={{display:"none"}}/></label>
              <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:10,color:"#8793a3"}}>{analysisInput.length.toLocaleString()} / 24,000자</span><button className="primary-btn" disabled={!analysisInput.trim() || analysisBusy} onClick={runGeminiAnalysis}>{analysisBusy ? "Gemini 분석 중..." : "실제 Gemini 분석 실행"}</button></div>
            </div>
            {analysisError && <div className="callout warn" style={{marginTop:12}}>{analysisError}</div>}
            {analysisResult && <div style={{marginTop:16,borderTop:"1px solid #e8edf3",paddingTop:14}}><div className="panel-head"><div><div className="panel-title">실제 API 분석 결과</div><div className="panel-sub">모델: {analysisModel} · Gemini 응답 원문</div></div><button className="secondary-btn" onClick={()=>navigator.clipboard.writeText(analysisResult).then(()=>notify("분석 결과를 복사했습니다."))}>결과 복사</button></div><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontFamily:"inherit",fontSize:12,lineHeight:1.8,color:"#344054",background:"#f8fafc",borderRadius:8,padding:14}}>{analysisResult}</pre></div>}
            <div style={{fontSize:10,color:"#8793a3",marginTop:10}}>무료 한도 초과 시 요청을 차단하며 유료 API로 자동 전환하지 않습니다. TXT·MD·CSV 텍스트 입력을 지원합니다. 기밀 자료는 무료 등급 데이터 사용 조건을 확인한 뒤 입력하세요.</div>
          </div>
          <div className="page-heading"><div><div className="eyebrow">AI-ASSISTED MATERIAL CONTROL</div><h1>자재운반 설비 운용계획 검토</h1><div className="subtitle">공정별 자재 이동 흐름과 운반설비 특성표를 바탕으로 설비 배치·배차·운용계획의 적정성을 검토합니다.</div></div><button className="primary-btn" onClick={()=>notify("보고서 업로드는 다음 단계에서 파일 분석 API와 연결할 예정입니다.")}><Upload size={15}/> 보고서 업로드</button></div>
          <div className="stats">
            <div className="stat-card"><div className="stat-label">전체 운영계획</div><div className="stat-value">{counts.all}<span style={{fontSize:12,color:"#8995a5",marginLeft:5}}>건</span></div><div className="stat-note">3.1 특성표 작성 · 3.2 운용계획 수립</div><div className="stat-icon" style={{background:"#edf2ff",color:"#315efb"}}><FileText size={17}/></div></div>
            <div className="stat-card"><div className="stat-label">승인 권고</div><div className="stat-value">{counts.approved}<span style={{fontSize:12,color:"#8995a5",marginLeft:5}}>건</span></div><div className="stat-note">추가 확인사항 없음</div><div className="stat-icon" style={{background:"#eaf7f0",color:"#16845b"}}><CheckCircle2 size={17}/></div></div>
            <div className="stat-card"><div className="stat-label">확인 필요</div><div className="stat-value">{counts.hold}<span style={{fontSize:12,color:"#8995a5",marginLeft:5}}>건</span></div><div className="stat-note">담당자 확인 후 판단</div><div className="stat-icon" style={{background:"#fff5df",color:"#b7791f"}}><AlertTriangle size={17}/></div></div>
            <div className="stat-card"><div className="stat-label">승인 불가</div><div className="stat-value">{counts.rejected}<span style={{fontSize:12,color:"#8995a5",marginLeft:5}}>건</span></div><div className="stat-note">핵심 기준 미충족</div><div className="stat-icon" style={{background:"#fff0f0",color:"#c24145"}}><XCircle size={17}/></div></div>
          </div>
          <div className="panel">
            <div className="panel-head"><div><div className="panel-title">자재운반 설비 검토 현황</div><div className="panel-sub">자재운반 설비 자재운반 설비 운용계획 10건 · 특성표와 운용계획 검토 근거 확인</div></div><div className="filters"><div style={{position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:10,color:"#9aa4b2"}}/><input className="search" style={{paddingLeft:30}} placeholder="계획명, 사업장 검색" value={search} onChange={e=>setSearch(e.target.value)}/></div><Filter size={14} color="#8b96a6"/>{["전체","승인","보류","불가"].map(f=><button key={f} className={`filter-btn ${filter===f?"selected":""}`} onClick={()=>setFilter(f)}>{f}</button>)}</div></div>
            <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>운영계획</th><th>사업장 / 라인</th><th>운영 기간</th><th>일일 운반 요구량</th><th>AI 검토</th><th>리스크</th><th>최근 업데이트</th><th></th></tr></thead><tbody>
              {filtered.map(p=><tr key={p.id} onClick={()=>{setSelected(p);setExpanded("1");}}><td><div className="doc-title">{p.title}</div><div className="doc-id">{p.id} · {p.owner}</div></td><td>{p.plant}<div className="doc-id">{p.line}</div></td><td>11.09 ~ 11.15</td><td style={{fontWeight:700,color:"#344054"}}>{p.quantity.toLocaleString()}회/일</td><td><StatusPill status={p.status}/></td><td><span className={`priority ${p.risk==="높음"?"high":p.risk==="보통"?"medium":"low"}`}>● {p.risk}</span></td><td>{p.updated}</td><td><ArrowRight size={15} color="#9aa4b2"/></td></tr>)}
              {filtered.length===0 && <tr><td colSpan={8}><div className="empty">검색 결과가 없습니다.</div></td></tr>}
            </tbody></table></div>
          </div>
          <div className="two-col">
            <div className="panel"><div className="panel-head"><div><div className="panel-title">우선 조치가 필요한 설비</div><div className="panel-sub">특성표·운용계획 검토에서 확인된 주요 리스크</div></div><span className="env-pill">TOP RISKS</span></div>
              {plans.filter(p=>p.risk==="높음").slice(0,4).map(p=><div className="alert-row" key={p.id}><div className="alert-dot" style={{background:p.status==="불가"?"#c24145":"#d99b32"}}/><div style={{flex:1}}><div className="alert-title">{p.title}</div><div className="alert-desc">{p.summary}</div></div><button className="secondary-btn" style={{padding:"6px 9px",fontSize:10}} onClick={()=>setSelected(p)}>상세 확인</button></div>)}
            </div>
            <div className="panel"><div className="panel-head"><div><div className="panel-title">3.1·3.2 검토 기준</div><div className="panel-sub">설비 특성표와 운용계획의 5개 영역 검토</div></div><ShieldCheck size={17} color="#315efb"/></div>
              {["설비 특성표 작성 완결성","설비 제원·운반능력 적합성","공정별 설비 수량·배치","설비 운용계획 적정성","점검·안전·유지관리 조건"].map((x,i)=><div className="side-stat" key={x}><span>{i+1}. {x}</span><span style={{color:"#315efb",fontWeight:700}}>검토 기준 <Check size={12} style={{verticalAlign:"middle"}}/></span></div>)}
            </div>
          </div>
          <div style={{fontSize:10,color:"#9aa4b2",textAlign:"center",padding:"8px 0"}}>본 화면은 가상 데이터 기반 프로토타입이며, 실제 사내 시스템·LLM과 연결되어 있지 않습니다.</div>
        </> : <>
          <button className="back-btn" onClick={()=>setSelected(null)}><ArrowLeft size={14}/> 대시보드로 돌아가기</button>
          <div className="detail-header"><div><div className="eyebrow">PLAN REVIEW　/　{selected.id}</div><h1>{selected.title}</h1><div className="subtitle">{selected.plant} · {selected.line} · 2026.11.09 ~ 11.15 · 담당 {selected.owner}</div></div><StatusPill status={selected.status}/></div>
          <div className="panel"><div className="panel-head"><div><div className="panel-title">AI 종합 검토 의견</div><div className="panel-sub">설비 특성표와 운용계획 5개 영역의 근거를 종합한 검토 요약</div></div><span className="env-pill">SAMPLE AI REVIEW</span></div><div style={{fontSize:13,lineHeight:1.8,color:"#455368"}}>{selected.summary}</div>
            <div className="detail-kpis"><div className="mini-kpi"><span className="stat-label">일일 운반 요구량</span><strong>{selected.quantity.toLocaleString()}회/일</strong></div><div className="mini-kpi"><span className="stat-label">검토 영역</span><strong>5개</strong></div><div className="mini-kpi"><span className="stat-label">리스크 수준</span><strong style={{color:selected.risk==="높음"?"#bd4145":selected.risk==="보통"?"#ad791e":"#19815b"}}>{selected.risk}</strong></div></div>
          </div>
          <div className="review-grid"><div className="panel"><div className="panel-head"><div><div className="panel-title">항목별 상세 검토</div><div className="panel-sub">판정 결과를 선택하면 검토 근거와 후속 조치를 확인할 수 있습니다.</div></div></div>
            {selected.reviews.map(r=><div className="review-item" key={r.id}><div className="review-item-head" onClick={()=>setExpanded(expanded===r.id?"":r.id)}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:10,color:"#9aa4b2",fontWeight:700}}>0{r.id}</span><span style={{fontSize:12,fontWeight:700,color:"#344054"}}>{r.title}</span></div><div style={{display:"flex",alignItems:"center",gap:10}}><StatusPill status={r.status}/><ChevronDown size={15} color="#9aa4b2"/></div></div>
              {expanded===r.id && <div className="review-item-body"><div className="review-line"><div className="review-label">검토 결과</div><div className="review-value">{r.summary}</div></div><div className="review-line"><div className="review-label">참조 근거</div><div className="review-value">{r.evidence.map(e=><span className="doc-chip" key={e}><FileText size={10} style={{marginRight:4}}/>{e}</span>)}</div></div><div className="review-line"><div className="review-label">후속 조치</div><div className="review-value">{r.action}</div></div><div className={`callout ${r.status==="불가"?"danger":r.status==="보류"?"warn":"ok"}`}>{r.status==="승인"?"기준 충족: 제출된 샘플 근거에서 별도 예외사항이 확인되지 않았습니다.":r.status==="보류"?"추가 확인 필요: 관련 담당자의 확인 및 증빙 보완 후 최종 판단이 필요합니다.":"기준 미충족: 현재 조건으로는 운영계획 승인을 권고할 수 없습니다."}</div></div>}
            </div>)}
          </div>
          <div className="side-sticky"><div className="panel"><div className="panel-title">검토 보고서 원문</div><div className="panel-sub">자재운반 설비 특성표·운용계획 관련 샘플 문서</div><div style={{marginTop:10}}>{["자재운반설비특성표.xlsx","공정별자재이동흐름도.pdf","설비점검·정비이력.xlsx","설비운용계획서.xlsx","설비점검·정비이력.xlsx"].map(d=><div className="side-stat" key={d}><span style={{display:"flex",gap:6,alignItems:"center"}}><FileText size={13} color="#718096"/>{d}</span><CheckCircle2 size={13} color="#16845b"/></div>)}</div><div className="doc-preview"><div className="doc-preview-title">보고서 미리보기</div>{selected.report.split("\n").filter(Boolean).slice(0,12).map((line,i)=><p key={i}>{line}</p>)}</div></div>
            <div className="panel"><div className="panel-title">담당자 최종 검토</div><div className="panel-sub">AI 결과는 의사결정 보조이며 최종 승인은 담당자 권한입니다.</div><div className="side-stat"><span>AI 권고</span><StatusPill status={selected.status}/></div><div className="side-stat"><span>담당자</span><b style={{color:"#344054"}}>{selected.owner}</b></div><div className="approval-actions"><button className="secondary-btn" onClick={()=>decide("보완 요청")}>보완 요청</button><button className="primary-btn" onClick={()=>decide("검토 완료")}>검토 완료</button></div></div>
          </div></div>
          <div style={{fontSize:10,color:"#9aa4b2",textAlign:"center",padding:"4px 0 15px"}}>시연용 판정 결과 · 실제 승인·반려 처리는 연결되어 있지 않습니다.</div>
        </>}
      </div>
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
