import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["general","work","personal","health","learning","finance","social","errands"];
const PRIORITIES = ["high","medium","low"];
const PRIORITY_COLORS = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e" };
const PRIORITY_BG = { high:"rgba(239,68,68,0.12)", medium:"rgba(245,158,11,0.12)", low:"rgba(34,197,94,0.12)" };
const CAT_ICONS = { general:"✦", work:"💼", personal:"🧘", health:"❤️", learning:"📚", finance:"💰", social:"👥", errands:"🛒" };
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PLATFORMS = ["zoom","google_meet","teams","webex","discord","slack","other"];
const PLATFORM_ICONS = { zoom:"🎥", google_meet:"🎙️", teams:"💻", webex:"📡", discord:"🎮", slack:"💬", other:"🔗" };
const PLATFORM_LABELS = { zoom:"Zoom", google_meet:"Google Meet", teams:"MS Teams", webex:"Webex", discord:"Discord", slack:"Slack", other:"Other" };
const STATUS_COLORS = { upcoming:"#7c3aed", completed:"#22c55e", missed:"#ef4444", cancelled:"#6b7280" };
const STATUS_BG = { upcoming:"rgba(124,58,237,0.12)", completed:"rgba(34,197,94,0.12)", missed:"rgba(239,68,68,0.12)", cancelled:"rgba(107,114,128,0.12)" };
const COHORT_COLORS = ["#7c3aed","#06b6d4","#f59e0b","#22c55e","#ef4444","#ec4899","#8b5cf6","#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";
const fmtTime = (t) => { if (!t) return ""; const [h,m]=t.split(":"); const hr=+h; return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?"PM":"AM"}`; };

// ── Global Styles ─────────────────────────────────────────────────────────────
const GlobalStyles = ({ dark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow-x:hidden}
    body{font-family:'DM Sans',sans-serif;background:${dark?"#0a0a0f":"#f4f3f0"};color:${dark?"#e8e6ff":"#1a1625"};transition:background 0.3s,color 0.3s}
    :root{
      --bg:${dark?"#0a0a0f":"#f4f3f0"};--bg2:${dark?"#111118":"#eceae6"};--bg3:${dark?"#18181f":"#e0deda"};
      --border:${dark?"rgba(139,92,246,0.15)":"rgba(100,80,180,0.12)"};
      --text:${dark?"#e8e6ff":"#1a1625"};--text2:${dark?"#9ca3af":"#6b7280"};
      --accent:#7c3aed;--accent2:#a855f7;--accent3:#c084fc;
      --card:${dark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.75)"};
      --card-hover:${dark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.95)"};
      --glow:${dark?"rgba(124,58,237,0.25)":"rgba(124,58,237,0.12)"};
    }
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}
    input,textarea,select{font-family:'DM Sans',sans-serif}
    button{cursor:pointer;font-family:'DM Sans',sans-serif}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fade-in{animation:fadeIn 0.35s ease forwards}
    .stagger>*{opacity:0;animation:fadeIn 0.35s ease forwards}
    .stagger>*:nth-child(1){animation-delay:0.05s}.stagger>*:nth-child(2){animation-delay:0.1s}
    .stagger>*:nth-child(3){animation-delay:0.15s}.stagger>*:nth-child(4){animation-delay:0.2s}
    .stagger>*:nth-child(5){animation-delay:0.25s}.stagger>*:nth-child(n+6){animation-delay:0.3s}
  `}</style>
);

// ── UI Primitives ─────────────────────────────────────────────────────────────
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,
    backdropFilter:"blur(12px)",transition:"all 0.2s",cursor:onClick?"pointer":"default",...style}}>{children}</div>
);
const Btn = ({ children, onClick, variant="primary", size="md", style, disabled }) => {
  const sizes={sm:{padding:"6px 14px",fontSize:13},md:{padding:"10px 20px",fontSize:14},lg:{padding:"13px 28px",fontSize:15}};
  const variants={
    primary:{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",boxShadow:"0 4px 20px rgba(124,58,237,0.35)",border:"none"},
    secondary:{background:"var(--bg3)",color:"var(--text)",border:"1px solid var(--border)"},
    ghost:{background:"transparent",color:"var(--text2)",border:"1px solid var(--border)"},
    danger:{background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)"},
    success:{background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.2)"},
  };
  return <button onClick={!disabled?onClick:undefined} style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:10,
    fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s",outline:"none",opacity:disabled?0.5:1,
    ...sizes[size],...variants[variant],...style}}>{children}</button>;
};
const Input = ({ label, type="text", value, onChange, placeholder, required, min, max, style }) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {label && <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} min={min} max={max}
      style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
        color:"var(--text)",fontSize:14,outline:"none",transition:"all 0.2s",...style}}
      onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="var(--border)"} />
  </div>
);
const Select = ({ label, value, onChange, options }) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {label && <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</label>}
    <select value={value} onChange={onChange}
      style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
        color:"var(--text)",fontSize:14,outline:"none",cursor:"pointer"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);
const Badge = ({ label, color, bg }) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,
    fontWeight:600,color:color||"var(--accent2)",background:bg||"rgba(124,58,237,0.12)",
    border:`1px solid ${color||"var(--accent)"}33`}}>{label}</span>
);
const Spinner = () => (
  <div style={{width:18,height:18,border:"2px solid var(--border)",borderTopColor:"var(--accent)",
    borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
);
const Notification = ({ msg, type }) => (
  <div style={{position:"fixed",top:20,right:20,zIndex:2000,
    background:type==="success"?"rgba(34,197,94,0.15)":type==="error"?"rgba(239,68,68,0.15)":"rgba(124,58,237,0.15)",
    border:`1px solid ${type==="success"?"rgba(34,197,94,0.3)":type==="error"?"rgba(239,68,68,0.3)":"rgba(124,58,237,0.3)"}`,
    borderRadius:12,padding:"12px 20px",backdropFilter:"blur(12px)",animation:"slideIn 0.3s ease",
    color:type==="success"?"#22c55e":type==="error"?"#ef4444":"var(--accent2)",fontSize:14,fontWeight:600,maxWidth:340}}>
    {type==="success"?"✓ ":type==="error"?"✕ ":"● "}{msg}
  </div>
);

// ── Auth ──────────────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }) => {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
  const submit = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode==="login") { const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; onAuth(data.user); }
      else { const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}}); if(error)throw error;
        if(data.user&&!data.session) setSuccess("Check your email to confirm your account!"); else onAuth(data.user); }
    } catch(err){setError(err.message);} finally{setLoading(false);}
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",left:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div className="fade-in" style={{width:"100%",maxWidth:420,padding:24}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:20,
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",fontSize:28,marginBottom:16,boxShadow:"0 8px 32px rgba(124,58,237,0.4)"}}>✦</div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em"}}>Focus<span style={{color:"var(--accent2)"}}>Flow</span></h1>
          <p style={{color:"var(--text2)",fontSize:14,marginTop:6}}>Your smart productivity companion</p>
        </div>
        <Card style={{padding:32}}>
          <div style={{display:"flex",gap:4,background:"var(--bg3)",borderRadius:12,padding:4,marginBottom:28}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",borderRadius:9,border:"none",fontSize:14,fontWeight:600,
                background:mode===m?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",color:mode===m?"#fff":"var(--text2)",cursor:"pointer",transition:"all 0.2s"}}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:16}}>
            {mode==="register"&&<Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/>}
            <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required/>
            <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
            {error&&<div style={{padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#ef4444",fontSize:13}}>{error}</div>}
            {success&&<div style={{padding:"10px 14px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,color:"#22c55e",fontSize:13}}>{success}</div>}
            <Btn size="lg" style={{justifyContent:"center",marginTop:8}} disabled={loading}>
              {loading?<><Spinner/> Processing...</>:mode==="login"?"Sign In →":"Create Account →"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
};

// ── Task Components ───────────────────────────────────────────────────────────
const TaskCard = ({ task, onToggle, onEdit, onDelete }) => {
  const [hover,setHover]=useState(false);
  return (
    <div className="fade-in" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:hover?"var(--card-hover)":"var(--card)",border:"1px solid var(--border)",
        borderLeft:`3px solid ${PRIORITY_COLORS[task.priority]}`,borderRadius:14,padding:"14px 16px",
        transition:"all 0.2s",display:"flex",alignItems:"flex-start",gap:12,
        boxShadow:hover?`0 4px 20px var(--glow)`:"none",opacity:task.is_completed?0.6:1}}>
      <button onClick={()=>onToggle(task)} style={{width:22,height:22,borderRadius:6,
        border:`2px solid ${task.is_completed?"#7c3aed":"var(--border)"}`,
        background:task.is_completed?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",
        cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",
        color:"#fff",fontSize:12,transition:"all 0.2s"}}>{task.is_completed?"✓":""}</button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:14,fontWeight:600,color:"var(--text)",textDecoration:task.is_completed?"line-through":"none",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:200}}>{task.title}</span>
          <Badge label={`${CAT_ICONS[task.category]} ${task.category}`}/>
          <Badge label={task.priority} color={PRIORITY_COLORS[task.priority]} bg={PRIORITY_BG[task.priority]}/>
        </div>
        {task.description&&<p style={{fontSize:12,color:"var(--text2)",marginTop:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{task.description}</p>}
        <div style={{display:"flex",gap:12,marginTop:6}}>
          {task.due_date&&<span style={{fontSize:11,color:"var(--text2)"}}>📅 {fmtDate(task.due_date)}</span>}
          {task.due_time&&<span style={{fontSize:11,color:"var(--text2)"}}>🕐 {fmtTime(task.due_time)}</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0,opacity:hover?1:0,transition:"opacity 0.2s"}}>
        <button onClick={()=>onEdit(task)} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:7,padding:"5px 9px",color:"var(--text2)",cursor:"pointer",fontSize:12}}>✎</button>
        <button onClick={()=>onDelete(task.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:7,padding:"5px 9px",color:"#ef4444",cursor:"pointer",fontSize:12}}>✕</button>
      </div>
    </div>
  );
};

const TaskModal = ({ task, defaultDate, onSave, onClose }) => {
  const [title,setTitle]=useState(task?.title||""); const [desc,setDesc]=useState(task?.description||"");
  const [date,setDate]=useState(task?.due_date||defaultDate||today()); const [time,setTime]=useState(task?.due_time||"");
  const [priority,setPriority]=useState(task?.priority||"medium"); const [category,setCategory]=useState(task?.category||"general");
  const [loading,setLoading]=useState(false);
  const save = async(e)=>{ e.preventDefault(); setLoading(true); await onSave({title,description:desc,due_date:date||null,due_time:time||null,priority,category}); setLoading(false); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{background:"var(--bg2)",borderRadius:20,padding:28,width:"100%",maxWidth:520,
        border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>{task?"Edit Task":"New Task"}</h2>
          <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,color:"var(--text2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <form onSubmit={save} style={{display:"flex",flexDirection:"column",gap:16}}>
          <Input label="Task Title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?" required/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Add details..." rows={3}
              style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
                color:"var(--text)",fontSize:14,resize:"vertical",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            <Input label="Time" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Select label="Priority" value={priority} onChange={e=>setPriority(e.target.value)}
              options={PRIORITIES.map(p=>({value:p,label:p.charAt(0).toUpperCase()+p.slice(1)}))}/>
            <Select label="Category" value={category} onChange={e=>setCategory(e.target.value)}
              options={CATEGORIES.map(c=>({value:c,label:CAT_ICONS[c]+" "+c.charAt(0).toUpperCase()+c.slice(1)}))}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            {PRIORITIES.map(p=>(
              <button key={p} type="button" onClick={()=>setPriority(p)}
                style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${priority===p?PRIORITY_COLORS[p]:"var(--border)"}`,
                  background:priority===p?PRIORITY_BG[p]:"transparent",color:priority===p?PRIORITY_COLORS[p]:"var(--text2)",
                  fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s",textTransform:"capitalize"}}>{p}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn variant="ghost" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn style={{flex:1,justifyContent:"center"}} disabled={loading}>{loading?<Spinner/>:task?"Update Task":"Add Task"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Meeting Card ──────────────────────────────────────────────────────────────
const MeetingCard = ({ meeting, cohorts, onStatusChange, onEdit, onDelete, onReminder }) => {
  const [hover,setHover]=useState(false);
  const cohort = cohorts.find(c=>c.id===meeting.cohort_id);
  const isPast = meeting.meeting_date < today() || (meeting.meeting_date===today() && meeting.start_time < new Date().toTimeString().slice(0,5));
  const statusColor = STATUS_COLORS[meeting.status];
  const statusBg = STATUS_BG[meeting.status];
  return (
    <div className="fade-in" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:hover?"var(--card-hover)":"var(--card)",border:"1px solid var(--border)",
        borderLeft:`3px solid ${statusColor}`,borderRadius:14,padding:"14px 16px",transition:"all 0.2s",
        boxShadow:hover?"0 4px 20px var(--glow)":"none"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{width:40,height:40,borderRadius:10,background:statusBg,border:`1px solid ${statusColor}33`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
          {PLATFORM_ICONS[meeting.platform]}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
            <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{meeting.title}</span>
            <Badge label={meeting.status.charAt(0).toUpperCase()+meeting.status.slice(1)} color={statusColor} bg={statusBg}/>
            {cohort&&<Badge label={cohort.name} color={cohort.color} bg={cohort.color+"22"}/>}
          </div>
          {meeting.description&&<p style={{fontSize:12,color:"var(--text2)",marginBottom:6}}>{meeting.description}</p>}
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"var(--text2)"}}>📅 {fmtDate(meeting.meeting_date)}</span>
            <span style={{fontSize:12,color:"var(--text2)"}}>🕐 {fmtTime(meeting.start_time)}{meeting.end_time?` – ${fmtTime(meeting.end_time)}`:""}</span>
            <span style={{fontSize:12,color:"var(--text2)"}}>{PLATFORM_ICONS[meeting.platform]} {PLATFORM_LABELS[meeting.platform]}</span>
          </div>
          {meeting.meeting_link&&(
            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,fontSize:12,color:"var(--accent2)",
                textDecoration:"none",background:"rgba(124,58,237,0.1)",padding:"4px 10px",borderRadius:6,
                border:"1px solid rgba(124,58,237,0.2)"}}>
              🔗 Join Meeting
            </a>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0,opacity:hover?1:0,transition:"opacity 0.2s"}}>
          {meeting.status==="upcoming"&&(
            <>
              <button onClick={()=>onStatusChange(meeting,"completed")} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",
                borderRadius:7,padding:"5px 9px",color:"#22c55e",cursor:"pointer",fontSize:11,fontWeight:600}}>✓ Done</button>
              <button onClick={()=>onStatusChange(meeting,"missed")} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",
                borderRadius:7,padding:"5px 9px",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:600}}>✕ Miss</button>
            </>
          )}
          {meeting.status==="missed"&&(
            <button onClick={()=>onStatusChange(meeting,"upcoming")} style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",
              borderRadius:7,padding:"5px 9px",color:"var(--accent2)",cursor:"pointer",fontSize:11,fontWeight:600}}>↺ Reopen</button>
          )}
          <button onClick={()=>onReminder(meeting)} title="Send Reminder Email"
            style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",
              borderRadius:7,padding:"5px 9px",color:"#f59e0b",cursor:"pointer",fontSize:11,fontWeight:600}}>📧 Remind</button>
          <button onClick={()=>onEdit(meeting)} style={{background:"var(--bg3)",border:"1px solid var(--border)",
            borderRadius:7,padding:"5px 9px",color:"var(--text2)",cursor:"pointer",fontSize:11}}>✎ Edit</button>
          <button onClick={()=>onDelete(meeting.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",
            borderRadius:7,padding:"5px 9px",color:"#ef4444",cursor:"pointer",fontSize:11}}>✕</button>
        </div>
      </div>
    </div>
  );
};

// ── Meeting Modal ─────────────────────────────────────────────────────────────
const MeetingModal = ({ meeting, cohorts, defaultDate, onSave, onClose }) => {
  const [title,setTitle]=useState(meeting?.title||"");
  const [desc,setDesc]=useState(meeting?.description||"");
  const [link,setLink]=useState(meeting?.meeting_link||"");
  const [date,setDate]=useState(meeting?.meeting_date||defaultDate||today());
  const [startTime,setStartTime]=useState(meeting?.start_time||"09:00");
  const [endTime,setEndTime]=useState(meeting?.end_time||"10:00");
  const [platform,setPlatform]=useState(meeting?.platform||"other");
  const [cohortId,setCohortId]=useState(meeting?.cohort_id||"");
  const [notes,setNotes]=useState(meeting?.notes||"");
  const [loading,setLoading]=useState(false);
  const save=async(e)=>{ e.preventDefault(); setLoading(true);
    await onSave({title,description:desc,meeting_link:link,meeting_date:date,start_time:startTime,
      end_time:endTime||null,platform,cohort_id:cohortId||null,notes});
    setLoading(false); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{background:"var(--bg2)",borderRadius:20,padding:28,width:"100%",maxWidth:560,
        border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.4)",margin:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>{meeting?"Edit Meeting":"Schedule Meeting"}</h2>
          <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,color:"var(--text2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <form onSubmit={save} style={{display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Meeting Title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Daily Standup" required/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Meeting agenda..." rows={2}
              style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
                color:"var(--text)",fontSize:14,resize:"vertical",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <Input label="Meeting Link" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://zoom.us/j/..." />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Input label="Date" type="date" value={date} onChange={e=>setDate(e.target.value)} required/>
            <Input label="Start Time" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required/>
            <Input label="End Time" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/>
          </div>
          {/* Platform selector */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Platform</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {PLATFORMS.map(p=>(
                <button key={p} type="button" onClick={()=>setPlatform(p)}
                  style={{padding:"7px 14px",borderRadius:9,border:`2px solid ${platform===p?"var(--accent)":"var(--border)"}`,
                    background:platform===p?"rgba(124,58,237,0.12)":"transparent",color:platform===p?"var(--accent2)":"var(--text2)",
                    fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>
                  {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {cohorts.length>0&&(
            <Select label="Cohort (optional)" value={cohortId} onChange={e=>setCohortId(e.target.value)}
              options={[{value:"",label:"— No Cohort —"},...cohorts.map(c=>({value:c.id,label:c.name}))]}/>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes..." rows={2}
              style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
                color:"var(--text)",fontSize:14,resize:"vertical",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn variant="ghost" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn style={{flex:1,justifyContent:"center"}} disabled={loading}>{loading?<Spinner/>:meeting?"Update":"Schedule Meeting"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Cohort Modal ──────────────────────────────────────────────────────────────
const CohortModal = ({ cohort, onSave, onClose }) => {
  const [name,setName]=useState(cohort?.name||"");
  const [desc,setDesc]=useState(cohort?.description||"");
  const [startDate,setStartDate]=useState(cohort?.start_date||today());
  const [endDate,setEndDate]=useState(cohort?.end_date||"");
  const [color,setColor]=useState(cohort?.color||"#7c3aed");
  const [skipDays,setSkipDays]=useState(cohort?._skipDays||[]);
  const [skipInput,setSkipInput]=useState("");
  const [skipReason,setSkipReason]=useState("");
  const [loading,setLoading]=useState(false);
  const addSkip=()=>{ if(skipInput&&!skipDays.find(s=>s.date===skipInput)){ setSkipDays([...skipDays,{date:skipInput,reason:skipReason}]); setSkipInput(""); setSkipReason(""); } };
  const save=async(e)=>{ e.preventDefault(); setLoading(true); await onSave({name,description:desc,start_date:startDate,end_date:endDate,color,skipDays}); setLoading(false); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{background:"var(--bg2)",borderRadius:20,padding:28,width:"100%",maxWidth:520,
        border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.4)",margin:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>{cohort?"Edit Cohort":"New Cohort"}</h2>
          <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,color:"var(--text2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <form onSubmit={save} style={{display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Cohort Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Bootcamp Batch 2025" required/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is this cohort about?" rows={2}
              style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",
                color:"var(--text)",fontSize:14,resize:"vertical",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Start Date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required/>
            <Input label="End Date" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} required min={startDate}/>
          </div>
          {/* Color picker */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COHORT_COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>setColor(c)}
                  style={{width:28,height:28,borderRadius:"50%",background:c,border:color===c?"3px solid var(--text)":"3px solid transparent",
                    cursor:"pointer",transition:"all 0.15s"}}/>
              ))}
            </div>
          </div>
          {/* Skip days */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Skip Days (holidays / breaks)</label>
            <div style={{display:"flex",gap:8}}>
              <input type="date" value={skipInput} onChange={e=>setSkipInput(e.target.value)} min={startDate} max={endDate}
                style={{flex:1,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",color:"var(--text)",fontSize:13,outline:"none"}}/>
              <input value={skipReason} onChange={e=>setSkipReason(e.target.value)} placeholder="Reason (optional)"
                style={{flex:1,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",color:"var(--text)",fontSize:13,outline:"none"}}/>
              <Btn size="sm" variant="secondary" onClick={addSkip}>+ Add</Btn>
            </div>
            {skipDays.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:140,overflowY:"auto"}}>
                {skipDays.sort((a,b)=>a.date<b.date?-1:1).map((s,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"6px 10px"}}>
                    <span style={{fontSize:12,color:"var(--text)"}}>🚫 {fmtDate(s.date)} {s.reason&&<span style={{color:"var(--text2)"}}>— {s.reason}</span>}</span>
                    <button type="button" onClick={()=>setSkipDays(skipDays.filter((_,j)=>j!==i))}
                      style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn variant="ghost" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn style={{flex:1,justifyContent:"center"}} disabled={loading}>{loading?<Spinner/>:cohort?"Update Cohort":"Create Cohort"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reminder Email Generator ──────────────────────────────────────────────────
const ReminderModal = ({ meeting, userEmail, cohorts, onClose }) => {
  const cohort = cohorts.find(c=>c.id===meeting.cohort_id);
  const subject = `Reminder: ${meeting.title} – ${fmtDate(meeting.meeting_date)} at ${fmtTime(meeting.start_time)}`;
  const body = `Hi there,

This is a friendly reminder about your upcoming meeting:

📌 Meeting: ${meeting.title}
📅 Date: ${fmtDate(meeting.meeting_date)}
🕐 Time: ${fmtTime(meeting.start_time)}${meeting.end_time ? ` – ${fmtTime(meeting.end_time)}` : ""}
💻 Platform: ${PLATFORM_LABELS[meeting.platform]}${cohort ? `\n👥 Cohort: ${cohort.name}` : ""}${meeting.description ? `\n\n📋 Agenda:\n${meeting.description}` : ""}${meeting.meeting_link ? `\n\n🔗 Join Link: ${meeting.meeting_link}` : ""}${meeting.notes ? `\n\n📝 Notes:\n${meeting.notes}` : ""}

Please make sure to join on time.

Best regards,
FocusFlow`;

  const mailto = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const [copied,setCopied]=useState(false);
  const copy=()=>{ navigator.clipboard.writeText(body); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{background:"var(--bg2)",borderRadius:20,padding:28,width:"100%",maxWidth:580,
        border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>📧 Reminder Email</h2>
          <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,color:"var(--text2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {/* Subject */}
        <div style={{marginBottom:12}}>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Subject</p>
          <div style={{background:"var(--bg3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--text)",border:"1px solid var(--border)"}}>{subject}</div>
        </div>
        {/* Body */}
        <div style={{marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Email Body</p>
          <pre style={{background:"var(--bg3)",borderRadius:10,padding:"14px",fontSize:12,color:"var(--text)",
            border:"1px solid var(--border)",whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif",
            maxHeight:280,overflowY:"auto",lineHeight:1.6}}>{body}</pre>
        </div>
        <div style={{display:"flex",gap:10}}>
          <a href={mailto} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            padding:"10px 20px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",
            borderRadius:10,textDecoration:"none",fontSize:14,fontWeight:600,boxShadow:"0 4px 20px rgba(124,58,237,0.35)"}}>
            📧 Open in Mail App
          </a>
          <Btn variant="secondary" onClick={copy} style={{flex:1,justifyContent:"center"}}>{copied?"✓ Copied!":"📋 Copy Body"}</Btn>
        </div>
        <p style={{fontSize:11,color:"var(--text2)",marginTop:10,textAlign:"center"}}>
          Opens your default mail client with the reminder pre-filled
        </p>
      </div>
    </div>
  );
};

// ── Meetings Page ─────────────────────────────────────────────────────────────
const MeetingsPage = ({ meetings, cohorts, userEmail, onAddMeeting, onEditMeeting, onDeleteMeeting, onStatusChange, onAddCohort, onEditCohort, onDeleteCohort, onReminder }) => {
  const [tab,setTab]=useState("meetings");
  const [filter,setFilter]=useState("all");
  const [cohortFilter,setCohortFilter]=useState("all");
  const [search,setSearch]=useState("");

  let filtered=[...meetings];
  if(filter!=="all") filtered=filtered.filter(m=>m.status===filter);
  if(cohortFilter!=="all") filtered=filtered.filter(m=>m.cohort_id===cohortFilter);
  if(search) filtered=filtered.filter(m=>m.title.toLowerCase().includes(search.toLowerCase()));
  filtered.sort((a,b)=>a.meeting_date<b.meeting_date?-1:a.meeting_date>b.meeting_date?1:a.start_time<b.start_time?-1:1);

  const todayMeetings = meetings.filter(m=>m.meeting_date===today());
  const missed = meetings.filter(m=>m.status==="missed");
  const upcoming = meetings.filter(m=>m.status==="upcoming"&&m.meeting_date>=today());
  const completed = meetings.filter(m=>m.status==="completed");

  return (
    <div className="stagger" style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"var(--text)"}}>Meetings</h1>
          <p style={{fontSize:13,color:"var(--text2)",marginTop:2}}>Manage your daily meetings & cohorts</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={()=>{ setTab("cohorts"); }}>👥 Cohorts</Btn>
          <Btn onClick={()=>onAddMeeting(today())}>+ Schedule Meeting</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
        {[
          {label:"Today's Meetings",value:todayMeetings.length,icon:"📅",color:"#7c3aed"},
          {label:"Upcoming",value:upcoming.length,icon:"⏰",color:"#06b6d4"},
          {label:"Completed",value:completed.length,icon:"✅",color:"#22c55e"},
          {label:"Missed",value:missed.length,icon:"⚠️",color:"#ef4444"},
        ].map(s=>(
          <Card key={s.label} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontSize:11,color:"var(--text2)",fontWeight:500}}>{s.label}</p>
                <p style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Syne',sans-serif",marginTop:4}}>{s.value}</p>
              </div>
              <span style={{fontSize:20}}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Missed meetings alert */}
      {missed.length>0&&(
        <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"14px 18px",
          display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <p style={{fontWeight:700,color:"#ef4444",fontSize:14}}>You have {missed.length} missed meeting{missed.length>1?"s":""}</p>
            <p style={{fontSize:12,color:"var(--text2)",marginTop:2}}>
              {missed.slice(0,2).map(m=>`${m.title} (${fmtDate(m.meeting_date)})`).join(", ")}
              {missed.length>2?` and ${missed.length-2} more`:""}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"var(--bg3)",borderRadius:12,padding:4,maxWidth:400}}>
        {["meetings","cohorts"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",fontSize:13,fontWeight:600,
            background:tab===t?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",
            color:tab===t?"#fff":"var(--text2)",cursor:"pointer",transition:"all 0.2s",textTransform:"capitalize"}}>
            {t==="meetings"?"📋 Meetings":"👥 Cohorts"}
          </button>
        ))}
      </div>

      {tab==="meetings"&&(
        <>
          {/* Filters */}
          <Card style={{padding:14}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search meetings..."
                style={{flex:1,minWidth:160,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9,
                  padding:"8px 14px",color:"var(--text)",fontSize:13,outline:"none"}}/>
              <div style={{display:"flex",gap:4,background:"var(--bg3)",borderRadius:9,padding:3}}>
                {["all","upcoming","completed","missed","cancelled"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 11px",borderRadius:7,border:"none",fontSize:11,fontWeight:600,
                    background:filter===f?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",
                    color:filter===f?"#fff":"var(--text2)",cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
                ))}
              </div>
              {cohorts.length>0&&(
                <select value={cohortFilter} onChange={e=>setCohortFilter(e.target.value)}
                  style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9,padding:"8px 12px",
                    color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
                  <option value="all">All Cohorts</option>
                  {cohorts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          </Card>
          {filtered.length===0?(
            <Card style={{textAlign:"center",padding:48}}>
              <p style={{fontSize:36,marginBottom:12}}>📅</p>
              <p style={{color:"var(--text2)",fontSize:15}}>No meetings found</p>
              <Btn style={{marginTop:16}} onClick={()=>onAddMeeting(today())}>Schedule Your First Meeting</Btn>
            </Card>
          ):(
            <div className="stagger" style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map(m=><MeetingCard key={m.id} meeting={m} cohorts={cohorts}
                onStatusChange={onStatusChange} onEdit={onEditMeeting} onDelete={onDeleteMeeting} onReminder={onReminder}/>)}
            </div>
          )}
        </>
      )}

      {tab==="cohorts"&&(
        <>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={()=>onAddCohort()}>+ New Cohort</Btn>
          </div>
          {cohorts.length===0?(
            <Card style={{textAlign:"center",padding:48}}>
              <p style={{fontSize:36,marginBottom:12}}>👥</p>
              <p style={{color:"var(--text2)",fontSize:15}}>No cohorts yet</p>
              <p style={{color:"var(--text2)",fontSize:13,marginTop:6}}>A cohort groups meetings over a date range with a schedule</p>
              <Btn style={{marginTop:16}} onClick={()=>onAddCohort()}>Create Your First Cohort</Btn>
            </Card>
          ):(
            <div className="stagger" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
              {cohorts.map(cohort=>{
                const cohortMeetings=meetings.filter(m=>m.cohort_id===cohort.id);
                const done=cohortMeetings.filter(m=>m.status==="completed").length;
                const missedC=cohortMeetings.filter(m=>m.status==="missed").length;
                const total=cohortMeetings.length;
                const pct=total?Math.round((done/total)*100):0;
                const now=today();
                const isActive=cohort.start_date<=now&&cohort.end_date>=now;
                const isEnded=cohort.end_date<now;
                return (
                  <Card key={cohort.id} style={{padding:20,borderLeft:`4px solid ${cohort.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:"var(--text)"}}>{cohort.name}</h3>
                        {cohort.description&&<p style={{fontSize:12,color:"var(--text2)",marginTop:3}}>{cohort.description}</p>}
                      </div>
                      <Badge label={isEnded?"Ended":isActive?"Active":"Upcoming"}
                        color={isEnded?"#6b7280":isActive?"#22c55e":"#f59e0b"}
                        bg={isEnded?"rgba(107,114,128,0.12)":isActive?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.12)"}/>
                    </div>
                    <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"var(--text2)"}}>📅 {fmtDate(cohort.start_date)}</span>
                      <span style={{fontSize:12,color:"var(--text2)"}}>→</span>
                      <span style={{fontSize:12,color:"var(--text2)"}}>{fmtDate(cohort.end_date)}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                      {[{l:"Total",v:total,c:"var(--text)"},{l:"Done",v:done,c:"#22c55e"},{l:"Missed",v:missedC,c:"#ef4444"}].map(s=>(
                        <div key={s.l} style={{textAlign:"center",background:"var(--bg3)",borderRadius:8,padding:"8px 4px"}}>
                          <p style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</p>
                          <p style={{fontSize:10,color:"var(--text2)"}}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                    {total>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:11,color:"var(--text2)"}}>Completion</span>
                          <span style={{fontSize:11,fontWeight:600,color:"var(--text)"}}>{pct}%</span>
                        </div>
                        <div style={{height:6,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${cohort.color},${cohort.color}99)`,borderRadius:3,transition:"width 1s ease"}}/>
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:8}}>
                      <Btn size="sm" variant="secondary" onClick={()=>onEditCohort(cohort)} style={{flex:1,justifyContent:"center"}}>✎ Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={()=>onDeleteCohort(cohort.id)} style={{flex:1,justifyContent:"center"}}>✕ Delete</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ tasks, meetings, profile, onAddTask, onToggle, onEdit, onDelete, onAddMeeting, onMeetingStatus, onMeetingReminder, cohorts }) => {
  const todayStr=today();
  const todayTasks=tasks.filter(t=>t.due_date===todayStr);
  const completed=todayTasks.filter(t=>t.is_completed);
  const pending=todayTasks.filter(t=>!t.is_completed);
  const upcoming=tasks.filter(t=>t.due_date>todayStr&&!t.is_completed).slice(0,4);
  const todayMeetings=meetings.filter(m=>m.meeting_date===todayStr);
  const nextMeeting=meetings.filter(m=>m.meeting_date>=todayStr&&m.status==="upcoming").sort((a,b)=>a.meeting_date<b.meeting_date?-1:a.start_time<b.start_time?-1:1)[0];
  const pct=todayTasks.length?Math.round((completed.length/todayTasks.length)*100):0;
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  return (
    <div className="stagger" style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{fontSize:13,color:"var(--text2)",fontWeight:500}}>{greeting} 👋</p>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:"var(--text)",letterSpacing:"-0.03em",marginTop:2}}>
            {profile?.full_name?profile.full_name.split(" ")[0]:"Friend"}
          </h1>
          <p style={{fontSize:14,color:"var(--text2)",marginTop:4}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={()=>onAddMeeting(todayStr)}>+ Meeting</Btn>
          <Btn onClick={()=>onAddTask(todayStr)}>+ Task</Btn>
        </div>
      </div>

      {/* Next meeting banner */}
      {nextMeeting&&(
        <div style={{background:`linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.08))`,
          border:"1px solid rgba(124,58,237,0.2)",borderRadius:16,padding:"16px 20px",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#a855f7)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{PLATFORM_ICONS[nextMeeting.platform]}</div>
            <div>
              <p style={{fontSize:11,color:"var(--accent3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Next Meeting</p>
              <p style={{fontWeight:700,color:"var(--text)",fontSize:15}}>{nextMeeting.title}</p>
              <p style={{fontSize:12,color:"var(--text2)"}}>{nextMeeting.meeting_date===todayStr?"Today":"on "+fmtDate(nextMeeting.meeting_date)} at {fmtTime(nextMeeting.start_time)}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {nextMeeting.meeting_link&&(
              <a href={nextMeeting.meeting_link} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",
                  background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",borderRadius:9,
                  textDecoration:"none",fontSize:13,fontWeight:600}}>🔗 Join Now</a>
            )}
            <Btn size="sm" variant="ghost" onClick={()=>onMeetingReminder(nextMeeting)}>📧 Remind</Btn>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
        {[
          {label:"Today's Tasks",value:todayTasks.length,icon:"📋",color:"#7c3aed"},
          {label:"Completed",value:completed.length,icon:"✅",color:"#22c55e"},
          {label:"Pending",value:pending.length,icon:"⏳",color:"#f59e0b"},
          {label:"Today's Meetings",value:todayMeetings.length,icon:"🎥",color:"#06b6d4"},
        ].map(s=>(
          <Card key={s.label} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontSize:11,color:"var(--text2)",fontWeight:500}}>{s.label}</p>
                <p style={{fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Syne',sans-serif",marginTop:4}}>{s.value}</p>
              </div>
              <span style={{fontSize:20}}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {todayTasks.length>0&&(
        <Card style={{padding:"20px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <p style={{fontSize:12,fontWeight:600,color:"var(--text2)"}}>TODAY'S PROGRESS</p>
              <p style={{fontSize:22,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif"}}>{pct}% Complete</p>
            </div>
            <p style={{fontSize:13,color:"var(--text2)"}}>{completed.length} of {todayTasks.length} tasks</p>
          </div>
          <div style={{height:10,background:"var(--bg3)",borderRadius:5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,borderRadius:5,transition:"width 1s ease",background:"linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)"}}/>
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:12,color:"var(--text)"}}>Today's Tasks</h3>
          {todayTasks.length===0?(
            <Card style={{textAlign:"center",padding:28,color:"var(--text2)"}}>
              <p style={{fontSize:28,marginBottom:8}}>🎯</p><p style={{fontSize:13}}>No tasks today</p>
              <Btn size="sm" style={{marginTop:12}} onClick={()=>onAddTask(todayStr)}>Add One</Btn>
            </Card>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {todayTasks.slice(0,4).map(t=><TaskCard key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}/>)}
            </div>
          )}
        </div>
        <div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:12,color:"var(--text)"}}>Today's Meetings</h3>
          {todayMeetings.length===0?(
            <Card style={{textAlign:"center",padding:28,color:"var(--text2)"}}>
              <p style={{fontSize:28,marginBottom:8}}>🎥</p><p style={{fontSize:13}}>No meetings today</p>
              <Btn size="sm" style={{marginTop:12}} onClick={()=>onAddMeeting(todayStr)}>Schedule One</Btn>
            </Card>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {todayMeetings.map(m=>(
                <div key={m.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderLeft:`3px solid ${STATUS_COLORS[m.status]}`,
                  borderRadius:14,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{m.title}</p>
                      <p style={{fontSize:11,color:"var(--text2)",marginTop:2}}>🕐 {fmtTime(m.start_time)} · {PLATFORM_ICONS[m.platform]} {PLATFORM_LABELS[m.platform]}</p>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Badge label={m.status} color={STATUS_COLORS[m.status]} bg={STATUS_BG[m.status]}/>
                      {m.meeting_link&&<a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                        style={{fontSize:11,color:"var(--accent2)",textDecoration:"none",background:"rgba(124,58,237,0.1)",padding:"3px 8px",borderRadius:6}}>Join</a>}
                    </div>
                  </div>
                  {m.status==="upcoming"&&(
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>onMeetingStatus(m,"completed")} style={{flex:1,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",
                        borderRadius:7,padding:"5px",color:"#22c55e",cursor:"pointer",fontSize:11,fontWeight:600}}>✓ Done</button>
                      <button onClick={()=>onMeetingStatus(m,"missed")} style={{flex:1,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",
                        borderRadius:7,padding:"5px",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:600}}>✕ Missed</button>
                      <button onClick={()=>onMeetingReminder(m)} style={{flex:1,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",
                        borderRadius:7,padding:"5px",color:"#f59e0b",cursor:"pointer",fontSize:11,fontWeight:600}}>📧 Remind</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Calendar ──────────────────────────────────────────────────────────────────
const CalendarView = ({ tasks, meetings, onAddTask, onToggle, onEdit, onDelete, onAddMeeting, onMeetingStatus, onMeetingReminder, cohorts }) => {
  const [current,setCurrent]=useState(new Date());
  const [selected,setSelected]=useState(today());
  const year=current.getFullYear(); const month=current.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[]; for(let i=0;i<firstDay;i++)cells.push(null); for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const tasksByDate={}; tasks.forEach(t=>{if(t.due_date){if(!tasksByDate[t.due_date])tasksByDate[t.due_date]=[];tasksByDate[t.due_date].push(t);}});
  const meetingsByDate={}; meetings.forEach(m=>{if(!meetingsByDate[m.meeting_date])meetingsByDate[m.meeting_date]=[];meetingsByDate[m.meeting_date].push(m);});
  const selTasks=tasks.filter(t=>t.due_date===selected);
  const selMeetings=meetings.filter(m=>m.meeting_date===selected);
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:24,alignItems:"start"}}>
      <Card style={{padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <button onClick={()=>setCurrent(new Date(year,month-1,1))} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px",color:"var(--text)",cursor:"pointer"}}>‹</button>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>{MONTHS[month]} {year}</h2>
          <button onClick={()=>setCurrent(new Date(year,month+1,1))} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px",color:"var(--text)",cursor:"pointer"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"var(--text2)",padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {cells.map((d,i)=>{
            if(!d)return <div key={i}/>;
            const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const dTasks=tasksByDate[ds]||[]; const dMeetings=meetingsByDate[ds]||[];
            const isToday=ds===today(); const isSel=ds===selected;
            return (
              <div key={i} onClick={()=>setSelected(ds)} style={{aspectRatio:"1",borderRadius:10,display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",
                background:isSel?"linear-gradient(135deg,#7c3aed,#a855f7)":isToday?"rgba(124,58,237,0.15)":"transparent",
                border:isToday&&!isSel?"1px solid var(--accent)":"1px solid transparent",transition:"all 0.15s"}}
                onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="var(--bg3)";}}
                onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=isToday?"rgba(124,58,237,0.15)":"transparent";}}>
                <span style={{fontSize:13,fontWeight:isToday||isSel?700:400,color:isSel?"#fff":"var(--text)"}}>{d}</span>
                <div style={{display:"flex",gap:2,marginTop:2,flexWrap:"wrap",justifyContent:"center",maxWidth:"80%"}}>
                  {dTasks.slice(0,2).map((t,j)=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:t.is_completed?"#22c55e":PRIORITY_COLORS[t.priority]}}/>)}
                  {dMeetings.slice(0,2).map((m,j)=><div key={"m"+j} style={{width:4,height:4,borderRadius:1,background:STATUS_COLORS[m.status]||"#06b6d4"}}/>)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,marginTop:12,flexWrap:"wrap"}}>
          {["high","medium","low"].map(p=>(
            <div key={p} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--text2)"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:PRIORITY_COLORS[p]}}/>Task: {p}
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--text2)"}}>
            <div style={{width:7,height:7,borderRadius:1,background:"#06b6d4"}}/>Meeting
          </div>
        </div>
      </Card>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700}}>{fmtDate(selected)}</h3>
          <div style={{display:"flex",gap:8}}>
            <Btn size="sm" variant="secondary" onClick={()=>onAddMeeting(selected)}>+ Meet</Btn>
            <Btn size="sm" onClick={()=>onAddTask(selected)}>+ Task</Btn>
          </div>
        </div>
        {selMeetings.length>0&&(
          <div style={{marginBottom:16}}>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Meetings</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {selMeetings.map(m=>(
                <div key={m.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderLeft:`3px solid ${STATUS_COLORS[m.status]}`,borderRadius:12,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{PLATFORM_ICONS[m.platform]} {m.title}</p>
                      <p style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{fmtTime(m.start_time)}</p>
                    </div>
                    <Badge label={m.status} color={STATUS_COLORS[m.status]} bg={STATUS_BG[m.status]}/>
                  </div>
                  {m.meeting_link&&<a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,fontSize:11,color:"var(--accent2)",textDecoration:"none",
                      background:"rgba(124,58,237,0.1)",padding:"3px 8px",borderRadius:5}}>🔗 Join</a>}
                </div>
              ))}
            </div>
          </div>
        )}
        {selTasks.length>0&&(
          <div>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Tasks</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {selTasks.map(t=><TaskCard key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}/>)}
            </div>
          </div>
        )}
        {selTasks.length===0&&selMeetings.length===0&&(
          <Card style={{textAlign:"center",padding:32,color:"var(--text2)"}}>
            <p style={{fontSize:28,marginBottom:8}}>✨</p>
            <p style={{fontSize:13}}>Nothing scheduled</p>
          </Card>
        )}
      </div>
    </div>
  );
};

// ── Task Manager ──────────────────────────────────────────────────────────────
const TaskManager = ({ tasks, onAddTask, onToggle, onEdit, onDelete }) => {
  const [filter,setFilter]=useState("all"); const [priorityF,setPriorityF]=useState("all");
  const [search,setSearch]=useState(""); const [sort,setSort]=useState("date");
  let filtered=[...tasks];
  if(filter==="pending")filtered=filtered.filter(t=>!t.is_completed);
  if(filter==="completed")filtered=filtered.filter(t=>t.is_completed);
  if(filter==="today")filtered=filtered.filter(t=>t.due_date===today());
  if(priorityF!=="all")filtered=filtered.filter(t=>t.priority===priorityF);
  if(search)filtered=filtered.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())||(t.description||"").toLowerCase().includes(search.toLowerCase()));
  if(sort==="date")filtered.sort((a,b)=>(a.due_date||"9")<(b.due_date||"9")?-1:1);
  if(sort==="priority")filtered.sort((a,b)=>["high","medium","low"].indexOf(a.priority)-["high","medium","low"].indexOf(b.priority));
  if(sort==="created")filtered.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"var(--text)"}}>All Tasks
          <span style={{marginLeft:10,fontSize:14,fontWeight:400,color:"var(--text2)"}}>{filtered.length} tasks</span>
        </h1>
        <Btn onClick={()=>onAddTask(today())}>+ New Task</Btn>
      </div>
      <Card style={{padding:14}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search tasks..."
            style={{flex:1,minWidth:160,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9,padding:"8px 14px",color:"var(--text)",fontSize:13,outline:"none"}}/>
          <div style={{display:"flex",gap:4,background:"var(--bg3)",borderRadius:9,padding:3}}>
            {["all","pending","completed","today"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 11px",borderRadius:7,border:"none",fontSize:12,fontWeight:600,
                background:filter===f?"linear-gradient(135deg,#7c3aed,#a855f7)":"transparent",color:filter===f?"#fff":"var(--text2)",cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
            ))}
          </div>
          <select value={priorityF} onChange={e=>setPriorityF(e.target.value)}
            style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9,padding:"8px 12px",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)}
            style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:9,padding:"8px 12px",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
            <option value="date">Sort: Date</option><option value="priority">Sort: Priority</option><option value="created">Sort: Newest</option>
          </select>
        </div>
      </Card>
      {filtered.length===0?<Card style={{textAlign:"center",padding:48}}><p style={{fontSize:36,marginBottom:12}}>🔍</p><p style={{color:"var(--text2)",fontSize:14}}>No tasks match your filters</p></Card>:(
        <div className="stagger" style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(t=><TaskCard key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}/>)}
        </div>
      )}
    </div>
  );
};

// ── Analytics ─────────────────────────────────────────────────────────────────
const Analytics = ({ tasks, meetings }) => {
  const todayStr=today();
  const todayTasks=tasks.filter(t=>t.due_date===todayStr);
  const todayDone=todayTasks.filter(t=>t.is_completed).length;
  const todayPct=todayTasks.length?Math.round((todayDone/todayTasks.length)*100):0;
  const weeklyData=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];
    const dt=tasks.filter(t=>t.due_date===ds); const dm=meetings.filter(m=>m.meeting_date===ds);
    weeklyData.push({day:DAYS[d.getDay()],date:ds,total:dt.length,done:dt.filter(t=>t.is_completed).length,
      meetings:dm.length,meetingsDone:dm.filter(m=>m.status==="completed").length,meetingsMissed:dm.filter(m=>m.status==="missed").length});}
  const allTotal=tasks.length; const allDone=tasks.filter(t=>t.is_completed).length;
  const overallPct=allTotal?Math.round((allDone/allTotal)*100):0;
  const allMeetings=meetings.length; const meetingsDone=meetings.filter(m=>m.status==="completed").length;
  const meetingsMissed=meetings.filter(m=>m.status==="missed").length;
  const meetingsPct=allMeetings?Math.round((meetingsDone/allMeetings)*100):0;
  const maxW=Math.max(...weeklyData.map(d=>Math.max(d.total,d.meetings)),1);
  const CHART_COLORS=["#7c3aed","#a855f7","#c084fc","#e879f9","#06b6d4","#22c55e","#f59e0b"];
  const catData=CATEGORIES.map(c=>({cat:c,total:tasks.filter(t=>t.category===c).length,done:tasks.filter(t=>t.category===c&&t.is_completed).length})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  return (
    <div className="stagger" style={{display:"flex",flexDirection:"column",gap:24}}>
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"var(--text)"}}>Analytics Dashboard</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
        {[
          {label:"Task Completion",value:`${overallPct}%`,sub:`${allDone}/${allTotal} tasks`,color:"#7c3aed"},
          {label:"Today's Rate",value:`${todayPct}%`,sub:`${todayDone}/${todayTasks.length} tasks`,color:"#22c55e"},
          {label:"Meeting Attendance",value:`${meetingsPct}%`,sub:`${meetingsDone}/${allMeetings} meetings`,color:"#06b6d4"},
          {label:"Meetings Missed",value:meetingsMissed,sub:"need attention",color:"#ef4444"},
        ].map(s=>(
          <Card key={s.label} style={{padding:"20px"}}>
            <p style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</p>
            <p style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Syne',sans-serif",margin:"8px 0 4px"}}>{s.value}</p>
            <p style={{fontSize:12,color:"var(--text2)"}}>{s.sub}</p>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <Card style={{padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,marginBottom:20}}>Weekly Tasks & Meetings</h3>
          <div style={{display:"flex",alignItems:"flex-end",gap:10,height:160}}>
            {weeklyData.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,height:"100%"}}>
                <div style={{flex:1,width:"100%",display:"flex",alignItems:"flex-end",gap:2}}>
                  <div style={{flex:1,height:`${(d.total/maxW)*100}%`,background:"var(--bg3)",borderRadius:"4px 4px 0 0",minHeight:4}}/>
                  <div style={{flex:1,height:`${(d.done/maxW)*100}%`,background:"linear-gradient(180deg,#7c3aed,#a855f7)",borderRadius:"4px 4px 0 0",minHeight:d.done?4:0}}/>
                  <div style={{flex:1,height:`${(d.meetings/maxW)*100}%`,background:"rgba(6,182,212,0.3)",borderRadius:"4px 4px 0 0",minHeight:d.meetings?4:0}}/>
                  <div style={{flex:1,height:`${(d.meetingsDone/maxW)*100}%`,background:"linear-gradient(180deg,#06b6d4,#22c55e)",borderRadius:"4px 4px 0 0",minHeight:d.meetingsDone?4:0}}/>
                </div>
                <span style={{fontSize:10,color:d.date===todayStr?"var(--accent2)":"var(--text2)",fontWeight:d.date===todayStr?700:400}}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap"}}>
            {[{c:"var(--bg3)",l:"Tasks Sched."},{c:"#7c3aed",l:"Tasks Done"},{c:"rgba(6,182,212,0.3)",l:"Meetings Sched."},{c:"#06b6d4",l:"Meetings Done"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--text2)"}}>
                <div style={{width:10,height:8,borderRadius:2,background:x.c}}/>{x.l}
              </div>
            ))}
          </div>
        </Card>
        <Card style={{padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,marginBottom:16}}>Meeting Attendance</h3>
          <div style={{position:"relative",width:130,height:130,margin:"0 auto"}}>
            <svg viewBox="0 0 36 36" style={{transform:"rotate(-90deg)",width:"100%",height:"100%"}}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg3)" strokeWidth="4"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="4"
                strokeDasharray={`${meetingsPct*0.8796} 87.96`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:20,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif"}}>{meetingsPct}%</span>
              <span style={{fontSize:9,color:"var(--text2)"}}>attended</span>
            </div>
          </div>
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
            {[{l:"Completed",v:meetingsDone,c:"#22c55e"},{l:"Missed",v:meetingsMissed,c:"#ef4444"},
              {l:"Upcoming",v:meetings.filter(m=>m.status==="upcoming").length,c:"#7c3aed"}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:s.c}}/><span style={{color:"var(--text2)"}}>{s.l}</span>
                </div>
                <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{s.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {catData.length>0&&(
        <Card style={{padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,marginBottom:20}}>Tasks by Category</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {catData.map((c,i)=>{
              const pct=c.total?Math.round((c.done/c.total)*100):0;
              return (
                <div key={c.cat}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{CAT_ICONS[c.cat]} {c.cat.charAt(0).toUpperCase()+c.cat.slice(1)}</span>
                    <span style={{fontSize:12,color:"var(--text2)"}}>{c.done}/{c.total} · {pct}%</span>
                  </div>
                  <div style={{height:8,background:"var(--bg3)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:4,transition:"width 1s ease",
                      background:`linear-gradient(90deg,${CHART_COLORS[i%CHART_COLORS.length]},${CHART_COLORS[(i+2)%CHART_COLORS.length]})`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Profile Modal ─────────────────────────────────────────────────────────────
const ProfileModal = ({ user, profile, onClose, onLogout, onUpdate, dark, onToggleDark }) => {
  const [name,setName]=useState(profile?.full_name||""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const save=async()=>{ setSaving(true); await onUpdate({full_name:name}); setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),2000); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{background:"var(--bg2)",borderRadius:20,padding:28,width:"100%",maxWidth:420,border:"1px solid var(--border)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700}}>Profile</h2>
          <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,color:"var(--text2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,padding:16,background:"var(--bg3)",borderRadius:14}}>
          <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",flexShrink:0}}>
            {(name||user?.email||"U")[0].toUpperCase()}
          </div>
          <div><p style={{fontWeight:700,color:"var(--text)",fontSize:15}}>{name||"User"}</p><p style={{color:"var(--text2)",fontSize:13}}>{user?.email}</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Input label="Display Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"var(--bg3)",borderRadius:12,border:"1px solid var(--border)"}}>
            <div><p style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Dark Mode</p><p style={{fontSize:11,color:"var(--text2)"}}>{dark?"Currently dark":"Currently light"}</p></div>
            <button onClick={onToggleDark} style={{width:48,height:26,borderRadius:13,background:dark?"linear-gradient(90deg,#7c3aed,#a855f7)":"var(--bg)",
              border:"2px solid var(--border)",cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
              <div style={{position:"absolute",top:2,left:dark?22:2,width:18,height:18,borderRadius:"50%",background:dark?"#fff":"var(--text2)",transition:"left 0.2s"}}/>
            </button>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={save} disabled={saving} style={{flex:1,justifyContent:"center"}}>{saving?<Spinner/>:saved?"✓ Saved!":"Save Changes"}</Btn>
            <Btn variant="danger" onClick={onLogout} style={{flex:1,justifyContent:"center"}}>Sign Out</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null); const [profile,setProfile]=useState(null);
  const [tasks,setTasks]=useState([]); const [meetings,setMeetings]=useState([]);
  const [cohorts,setCohorts]=useState([]); const [skipDays,setSkipDays]=useState({});
  const [loading,setLoading]=useState(true); const [page,setPage]=useState("dashboard");
  const [dark,setDark]=useState(true); const [sidebarOpen,setSidebarOpen]=useState(true);
  const [showTaskModal,setShowTaskModal]=useState(false); const [editTask,setEditTask]=useState(null);
  const [showMeetingModal,setShowMeetingModal]=useState(false); const [editMeeting,setEditMeeting]=useState(null);
  const [showCohortModal,setShowCohortModal]=useState(false); const [editCohort,setEditCohort]=useState(null);
  const [showReminderModal,setShowReminderModal]=useState(false); const [reminderMeeting,setReminderMeeting]=useState(null);
  const [showProfile,setShowProfile]=useState(false);
  const [defaultDate,setDefaultDate]=useState(today()); const [notif,setNotif]=useState(null);

  const notify=(msg,type="success")=>{ setNotif({msg,type}); setTimeout(()=>setNotif(null),3000); };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){setUser(session.user);init(session.user.id);}
      setLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user){setUser(session.user);init(session.user.id);}
      else{setUser(null);setProfile(null);setTasks([]);setMeetings([]);setCohorts([]);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const init=async(uid)=>{ await Promise.all([loadProfile(uid),loadTasks(uid),loadMeetings(uid),loadCohorts(uid)]); };
  const loadProfile=async(uid)=>{ const{data}=await supabase.from("profiles").select("*").eq("id",uid).single(); if(data){setProfile(data);setDark(data.theme==="dark");} };
  const loadTasks=async(uid)=>{ const{data,error}=await supabase.from("tasks").select("*").eq("user_id",uid).order("created_at",{ascending:false}); if(!error)setTasks(data||[]); };
  const loadMeetings=async(uid)=>{ const{data,error}=await supabase.from("meetings").select("*").eq("user_id",uid).order("meeting_date",{ascending:true}); if(!error)setMeetings(data||[]); };
  const loadCohorts=async(uid)=>{
    const{data:cData,error}=await supabase.from("cohorts").select("*").eq("user_id",uid).order("start_date",{ascending:true});
    if(!error&&cData){
      setCohorts(cData);
      const{data:sData}=await supabase.from("cohort_skip_days").select("*").in("cohort_id",cData.map(c=>c.id));
      if(sData){ const map={}; sData.forEach(s=>{if(!map[s.cohort_id])map[s.cohort_id]=[]; map[s.cohort_id].push(s);}); setSkipDays(map); }
    }
  };

  // Task CRUD
  const handleAddTask=async(td)=>{ const{data,error}=await supabase.from("tasks").insert([{...td,user_id:user.id}]).select().single(); if(!error){setTasks(t=>[data,...t]);notify("Task created!");setShowTaskModal(false);setEditTask(null);}else notify(error.message,"error"); };
  const handleUpdateTask=async(td)=>{ const{data,error}=await supabase.from("tasks").update(td).eq("id",editTask.id).select().single(); if(!error){setTasks(t=>t.map(x=>x.id===editTask.id?data:x));notify("Task updated!");setShowTaskModal(false);setEditTask(null);}else notify(error.message,"error"); };
  const handleToggle=async(task)=>{ const u={is_completed:!task.is_completed,completed_at:!task.is_completed?new Date().toISOString():null}; const{data,error}=await supabase.from("tasks").update(u).eq("id",task.id).select().single(); if(!error){setTasks(t=>t.map(x=>x.id===task.id?data:x));notify(data.is_completed?"Task completed! 🎉":"Task reopened");} };
  const handleDeleteTask=async(id)=>{ const{error}=await supabase.from("tasks").delete().eq("id",id); if(!error){setTasks(t=>t.filter(x=>x.id!==id));notify("Task deleted");} };

  // Meeting CRUD
  const handleAddMeeting=async(md)=>{ const{data,error}=await supabase.from("meetings").insert([{...md,user_id:user.id}]).select().single(); if(!error){setMeetings(m=>[...m,data].sort((a,b)=>a.meeting_date<b.meeting_date?-1:1));notify("Meeting scheduled! 📅");setShowMeetingModal(false);setEditMeeting(null);}else notify(error.message,"error"); };
  const handleUpdateMeeting=async(md)=>{ const{data,error}=await supabase.from("meetings").update(md).eq("id",editMeeting.id).select().single(); if(!error){setMeetings(m=>m.map(x=>x.id===editMeeting.id?data:x));notify("Meeting updated!");setShowMeetingModal(false);setEditMeeting(null);}else notify(error.message,"error"); };
  const handleDeleteMeeting=async(id)=>{ const{error}=await supabase.from("meetings").delete().eq("id",id); if(!error){setMeetings(m=>m.filter(x=>x.id!==id));notify("Meeting deleted");} };
  const handleMeetingStatus=async(meeting,status)=>{ const{data,error}=await supabase.from("meetings").update({status}).eq("id",meeting.id).select().single(); if(!error){setMeetings(m=>m.map(x=>x.id===meeting.id?data:x));notify(status==="completed"?"Meeting marked complete! ✅":status==="missed"?"Marked as missed":"Meeting reopened");} };

  // Cohort CRUD
  const handleAddCohort=async({skipDays:sd,...cd})=>{
    const{data,error}=await supabase.from("cohorts").insert([{...cd,user_id:user.id}]).select().single();
    if(!error){
      if(sd?.length){await supabase.from("cohort_skip_days").insert(sd.map(s=>({cohort_id:data.id,skip_date:s.date,reason:s.reason||null})));}
      await loadCohorts(user.id); notify("Cohort created! 👥"); setShowCohortModal(false); setEditCohort(null);
    }else notify(error.message,"error");
  };
  const handleUpdateCohort=async({skipDays:sd,...cd})=>{
    const{error}=await supabase.from("cohorts").update(cd).eq("id",editCohort.id);
    if(!error){
      await supabase.from("cohort_skip_days").delete().eq("cohort_id",editCohort.id);
      if(sd?.length){await supabase.from("cohort_skip_days").insert(sd.map(s=>({cohort_id:editCohort.id,skip_date:s.date,reason:s.reason||null})));}
      await loadCohorts(user.id); notify("Cohort updated!"); setShowCohortModal(false); setEditCohort(null);
    }else notify(error.message,"error");
  };
  const handleDeleteCohort=async(id)=>{ const{error}=await supabase.from("cohorts").delete().eq("id",id); if(!error){setCohorts(c=>c.filter(x=>x.id!==id));notify("Cohort deleted");} };
  const handleUpdateProfile=async(updates)=>{ await supabase.from("profiles").update(updates).eq("id",user.id); setProfile(p=>({...p,...updates})); };
  const handleToggleDark=()=>{ const nd=!dark; setDark(nd); supabase.from("profiles").update({theme:nd?"dark":"light"}).eq("id",user.id); };

  const openAddTask=(date)=>{ setEditTask(null);setDefaultDate(date);setShowTaskModal(true); };
  const openEditTask=(task)=>{ setEditTask(task);setShowTaskModal(true); };
  const openAddMeeting=(date)=>{ setEditMeeting(null);setDefaultDate(date);setShowMeetingModal(true); };
  const openEditMeeting=(m)=>{ setEditMeeting(m);setShowMeetingModal(true); };
  const openAddCohort=()=>{ setEditCohort(null);setShowCohortModal(true); };
  const openEditCohort=(c)=>{
    const cSkips=(skipDays[c.id]||[]).map(s=>({date:s.skip_date,reason:s.reason||""}));
    setEditCohort({...c,_skipDays:cSkips});setShowCohortModal(true);
  };
  const openReminder=(m)=>{ setReminderMeeting(m);setShowReminderModal(true); };

  const NAV=[
    {id:"dashboard",icon:"⬡",label:"Dashboard"},
    {id:"calendar",icon:"◈",label:"Calendar"},
    {id:"tasks",icon:"◻",label:"Tasks"},
    {id:"meetings",icon:"🎥",label:"Meetings"},
    {id:"analytics",icon:"◆",label:"Analytics"},
  ];

  if(loading) return (<><GlobalStyles dark={dark}/><div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{fontSize:32}}>✦</div><Spinner/></div></>);
  if(!user) return (<><GlobalStyles dark={dark}/><AuthScreen onAuth={u=>{setUser(u);init(u.id);}}/></>);

  return (
    <>
      <GlobalStyles dark={dark}/>
      {notif&&<Notification msg={notif.msg} type={notif.type}/>}
      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        {/* Sidebar */}
        <div style={{width:sidebarOpen?220:64,flexShrink:0,background:"var(--bg2)",borderRight:"1px solid var(--border)",
          display:"flex",flexDirection:"column",transition:"width 0.3s ease",overflow:"hidden"}}>
          <div style={{padding:"20px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--border)"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✦</div>
            {sidebarOpen&&<span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"var(--text)",whiteSpace:"nowrap"}}>FocusFlow</span>}
          </div>
          <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:4}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",
                background:page===n.id?"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.15))":"transparent",
                color:page===n.id?"var(--accent2)":"var(--text2)",cursor:"pointer",textAlign:"left",
                borderLeft:page===n.id?"3px solid var(--accent)":"3px solid transparent",
                fontWeight:page===n.id?600:400,fontSize:14,transition:"all 0.15s",width:"100%",whiteSpace:"nowrap"}}>
                <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
                {sidebarOpen&&n.label}
                {n.id==="meetings"&&meetings.filter(m=>m.status==="missed").length>0&&(
                  <span style={{marginLeft:"auto",background:"#ef4444",color:"#fff",borderRadius:"50%",width:18,height:18,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>
                    {meetings.filter(m=>m.status==="missed").length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div style={{padding:"12px 8px",borderTop:"1px solid var(--border)"}}>
            <button onClick={()=>setShowProfile(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",
              background:"transparent",color:"var(--text2)",cursor:"pointer",width:"100%",whiteSpace:"nowrap"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>
                {(profile?.full_name||user.email||"U")[0].toUpperCase()}
              </div>
              {sidebarOpen&&<span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis"}}>{profile?.full_name||user.email?.split("@")[0]}</span>}
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <header style={{padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",
            borderBottom:"1px solid var(--border)",background:"var(--bg2)",flexShrink:0}}>
            <button onClick={()=>setSidebarOpen(s=>!s)} style={{background:"transparent",border:"none",color:"var(--text2)",cursor:"pointer",fontSize:18,padding:4}}>☰</button>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={handleToggleDark} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",color:"var(--text2)",cursor:"pointer",fontSize:14}}>{dark?"☀️":"🌙"}</button>
              <Btn size="sm" variant="secondary" onClick={()=>openAddMeeting(today())}>+ Meeting</Btn>
              <Btn size="sm" onClick={()=>openAddTask(today())}>+ Task</Btn>
              <button onClick={()=>setShowProfile(true)} style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                border:"none",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {(profile?.full_name||user.email||"U")[0].toUpperCase()}
              </button>
            </div>
          </header>
          <main style={{flex:1,overflowY:"auto",padding:24}}>
            {page==="dashboard"&&<Dashboard tasks={tasks} meetings={meetings} profile={profile} cohorts={cohorts}
              onAddTask={openAddTask} onToggle={handleToggle} onEdit={openEditTask} onDelete={handleDeleteTask}
              onAddMeeting={openAddMeeting} onMeetingStatus={handleMeetingStatus} onMeetingReminder={openReminder}/>}
            {page==="calendar"&&<CalendarView tasks={tasks} meetings={meetings} cohorts={cohorts}
              onAddTask={openAddTask} onToggle={handleToggle} onEdit={openEditTask} onDelete={handleDeleteTask}
              onAddMeeting={openAddMeeting} onMeetingStatus={handleMeetingStatus} onMeetingReminder={openReminder}/>}
            {page==="tasks"&&<TaskManager tasks={tasks} onAddTask={openAddTask} onToggle={handleToggle} onEdit={openEditTask} onDelete={handleDeleteTask}/>}
            {page==="meetings"&&<MeetingsPage meetings={meetings} cohorts={cohorts} userEmail={user.email}
              onAddMeeting={openAddMeeting} onEditMeeting={openEditMeeting} onDeleteMeeting={handleDeleteMeeting}
              onStatusChange={handleMeetingStatus} onAddCohort={openAddCohort} onEditCohort={openEditCohort}
              onDeleteCohort={handleDeleteCohort} onReminder={openReminder}/>}
            {page==="analytics"&&<Analytics tasks={tasks} meetings={meetings}/>}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showTaskModal&&<TaskModal task={editTask} defaultDate={defaultDate} onSave={editTask?handleUpdateTask:handleAddTask} onClose={()=>{setShowTaskModal(false);setEditTask(null);}}/>}
      {showMeetingModal&&<MeetingModal meeting={editMeeting} cohorts={cohorts} defaultDate={defaultDate} onSave={editMeeting?handleUpdateMeeting:handleAddMeeting} onClose={()=>{setShowMeetingModal(false);setEditMeeting(null);}}/>}
      {showCohortModal&&<CohortModal cohort={editCohort} onSave={editCohort?handleUpdateCohort:handleAddCohort} onClose={()=>{setShowCohortModal(false);setEditCohort(null);}}/>}
      {showReminderModal&&reminderMeeting&&<ReminderModal meeting={reminderMeeting} userEmail={user.email} cohorts={cohorts} onClose={()=>{setShowReminderModal(false);setReminderMeeting(null);}}/>}
      {showProfile&&<ProfileModal user={user} profile={profile} dark={dark} onClose={()=>setShowProfile(false)} onLogout={()=>supabase.auth.signOut()} onUpdate={handleUpdateProfile} onToggleDark={handleToggleDark}/>}
    </>
  );
}