import { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import Login from "./Login";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [darkMode, setDarkMode] = useState(true);
  const [matchFile, setMatchFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverJD, setCoverJD] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [interviewFile, setInterviewFile] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I am your AI resume coach. Ask me anything about resumes, job searching, or career advice!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadHistory(u.uid);
    });
    return unsub;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadHistory = async (uid) => {
    try {
      const q = query(collection(db, "analyses"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setHistory(data);
    } catch (err) {
      console.log("History error:", err.message);
    }
  };

  const saveToHistory = async (analysis) => {
    try {
      await addDoc(collection(db, "analyses"), {
        uid: user.uid,
        userName: user.displayName,
        analysis,
        createdAt: new Date(),
      });
      await loadHistory(user.uid);
    } catch (err) {
      console.log("Save error:", err.message);
    }
  };

  const uploadResume = async () => {
    if (!file) { alert("Please upload a resume PDF"); return; }
    const formData = new FormData();
    formData.append("resume", file);
    try {
      setLoading(true); setResult(null);
      const res = await axios.post("https://resume-analyzer-backend-1n2h.onrender.com/analyze", formData);
      setResult(res.data.analysis);
      await saveToHistory(res.data.analysis);
      setActivePage("result");
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally { setLoading(false); }
  };

  const matchResume = async () => {
    if (!matchFile) { alert("Please upload a resume PDF"); return; }
    if (!jobDescription.trim()) { alert("Please paste a job description"); return; }
    const formData = new FormData();
    formData.append("resume", matchFile);
    formData.append("jobDescription", jobDescription);
    try {
      setMatchLoading(true); setMatchResult(null);
      const res = await axios.post("https://resume-analyzer-backend-1n2h.onrender.com/match", formData);
      setMatchResult(res.data.match);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally { setMatchLoading(false); }
  };

  const generateCoverLetter = async () => {
    if (!coverFile) { alert("Please upload a resume PDF"); return; }
    if (!coverJD.trim()) { alert("Please paste a job description"); return; }
    const formData = new FormData();
    formData.append("resume", coverFile);
    formData.append("jobDescription", coverJD);
    formData.append("companyName", companyName);
    formData.append("jobTitle", jobTitle);
    try {
      setCoverLoading(true); setCoverLetter("");
      const res = await axios.post("https://resume-analyzer-backend-1n2h.onrender.com/coverletter", formData);
      setCoverLetter(res.data.coverLetter);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally { setCoverLoading(false); }
  };

  const generateInterviewQuestions = async () => {
    if (!interviewFile) { alert("Please upload a resume PDF"); return; }
    const formData = new FormData();
    formData.append("resume", interviewFile);
    try {
      setInterviewLoading(true); setInterviewQuestions(null);
      const res = await axios.post("https://resume-analyzer-backend-1n2h.onrender.com/interview", formData);
      setInterviewQuestions(res.data.questions);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    } finally { setInterviewLoading(false); }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const newMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    try {
      setChatLoading(true);
      const res = await axios.post("https://resume-analyzer-backend-1n2h.onrender.com/chat", { messages: newMessages });
      setChatMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (error) {
      setChatMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally { setChatLoading(false); }
  };

  const downloadCoverLetter = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(coverLetter, 180);
    doc.setFontSize(12);
    doc.text(lines, 15, 20);
    doc.save("cover-letter.pdf");
  };

  const downloadPDF = (data) => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text("Resume Analysis Report", 15, y); y += 12;
    doc.setFontSize(12);
    doc.text("ATS Score: " + data.atsScore, 15, y); y += 10;
    doc.text("Technical Skills:", 15, y); y += 7;
    data.technicalSkills.forEach((s) => { doc.text("  - " + s, 15, y); y += 7; });
    doc.text("Missing Skills:", 15, y); y += 7;
    data.missingSkills.forEach((s) => { doc.text("  - " + s, 15, y); y += 7; });
    doc.text("Improvements:", 15, y); y += 7;
    data.improvements.forEach((s) => { doc.text("  - " + s, 15, y); y += 7; });
    doc.text("Best Job Roles:", 15, y); y += 7;
    data.jobRoles.forEach((s) => { doc.text("  - " + s, 15, y); y += 7; });
    doc.save("resume-analysis.pdf");
  };

  const atsNumber = result ? parseInt(result.atsScore) : 0;
  const matchNumber = matchResult ? parseInt(matchResult.matchScore) : 0;
  const bg = darkMode ? "bg-slate-950" : "bg-gray-100";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";
  const text = darkMode ? "text-white" : "text-gray-900";
  const subtext = darkMode ? "text-slate-400" : "text-gray-500";
  const sidebar = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";
  const inputBg = darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900";

  if (!user) return <Login />;

  return (
    <div className={"min-h-screen " + bg + " " + text + " flex"}>
      <div className={"w-64 min-h-screen " + sidebar + " border-r flex flex-col p-6 fixed left-0 top-0 overflow-y-auto"}>
        <h1 className="text-2xl font-bold text-blue-500 mb-10">ResumeAI</h1>
        <nav className="flex flex-col gap-2 flex-1">
          {[
            { id: "home", icon: "Home", label: "Dashboard" },
            { id: "result", icon: "Chart", label: "Analysis" },
            { id: "match", icon: "Target", label: "JD Matcher" },
            { id: "cover", icon: "Mail", label: "Cover Letter" },
            { id: "interview", icon: "Mic", label: "Interview Prep" },
            { id: "chat", icon: "Chat", label: "AI Chat Coach" },
            { id: "history", icon: "Clock", label: "History" },
          ].map((item) => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={"flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all " + (activePage === item.id ? "bg-blue-600 text-white" : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-gray-100 text-gray-600")}>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-3 mt-6">
          <button onClick={() => setDarkMode(!darkMode)} className={"flex items-center gap-3 px-4 py-3 rounded-xl " + (darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-gray-100 text-gray-600")}>
            <span className="font-medium">{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <div className={"flex items-center gap-3 px-4 py-3 rounded-xl " + (darkMode ? "bg-slate-800" : "bg-gray-100")}>
            <img src={user.photoURL} className="w-8 h-8 rounded-full" />
            <p className="text-sm font-medium truncate">{user.displayName}</p>
          </div>
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white">
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      <div className="ml-64 flex-1 p-10">

        {activePage === "home" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-2">Welcome back, {user.displayName?.split(" ")[0]}!</h2>
              <p className={subtext}>Upload your resume and get AI-powered insights instantly.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className={card + " border p-6 rounded-2xl"}>
                <p className={subtext + " text-sm mb-1"}>Total Analyses</p>
                <p className="text-4xl font-bold text-blue-500">{history.length}</p>
              </div>
              <div className={card + " border p-6 rounded-2xl"}>
                <p className={subtext + " text-sm mb-1"}>Latest ATS Score</p>
                <p className="text-4xl font-bold text-green-500">{history[0]?.analysis?.atsScore || "N/A"}</p>
              </div>
              <div className={card + " border p-6 rounded-2xl"}>
                <p className={subtext + " text-sm mb-1"}>Top Job Role</p>
                <p className="text-xl font-bold text-purple-500 truncate">{history[0]?.analysis?.jobRoles?.[0] || "N/A"}</p>
              </div>
            </div>
            <div className={card + " border p-10 rounded-3xl mb-6"}>
              <h3 className="text-2xl font-bold mb-6">Analyze New Resume</h3>
              <div className={"border-2 border-dashed " + (darkMode ? "border-slate-700" : "border-gray-300") + " rounded-2xl p-10 text-center"}>
                <p className={subtext + " mb-6"}>Upload your resume PDF to get started</p>
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="mb-4" />
                {file && <p className="text-green-400 mb-4">Selected: {file.name}</p>}
                <br />
                <button onClick={uploadResume} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-10 py-4 rounded-2xl font-semibold text-lg text-white">
                  {loading ? "Analyzing..." : "Analyze Resume"}
                </button>
              </div>
              {loading && (
                <div className="mt-6">
                  <div className={"w-full " + (darkMode ? "bg-slate-700" : "bg-gray-200") + " rounded-full h-2"}>
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "match", label: "JD Matcher", desc: "Compare resume to job description" },
                { id: "cover", label: "Cover Letter", desc: "Generate a cover letter" },
                { id: "chat", label: "AI Chat Coach", desc: "Get resume advice from AI" },
              ].map((action) => (
                <button key={action.id} onClick={() => setActivePage(action.id)}
                  className={card + " border p-6 rounded-2xl text-left hover:border-blue-500 transition-all"}>
                  <p className="font-bold text-lg mb-1">{action.label}</p>
                  <p className={subtext + " text-sm"}>{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activePage === "result" && (
          <div>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-4xl font-bold mb-2">Resume Analysis</h2>
                <p className={subtext}>Here are your AI-powered insights</p>
              </div>
              {result && <button onClick={() => downloadPDF(result)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold text-white">Download PDF</button>}
            </div>
            {!result ? (
              <div className={card + " border p-10 rounded-3xl text-center"}>
                <p className={subtext}>No analysis yet. Go to Dashboard and upload a resume first.</p>
                <button onClick={() => setActivePage("home")} className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-semibold">Go to Dashboard</button>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className={card + " border p-8 rounded-3xl"}>
                  <h3 className="text-xl font-bold mb-4 text-blue-400">ATS Score</h3>
                  <div className="flex items-center gap-6">
                    <p className="text-7xl font-bold">{result.atsScore}</p>
                    <div className="flex-1">
                      <div className={"w-full " + (darkMode ? "bg-slate-700" : "bg-gray-200") + " rounded-full h-4"}>
                        <div className={"h-4 rounded-full " + (atsNumber >= 80 ? "bg-green-500" : atsNumber >= 60 ? "bg-yellow-500" : "bg-red-500")} style={{ width: atsNumber + "%" }}></div>
                      </div>
                      <p className={subtext + " mt-2 text-sm"}>{atsNumber >= 80 ? "Excellent! Your resume is ATS optimized." : atsNumber >= 60 ? "Good, but there is room for improvement." : "Needs significant improvement."}</p>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={card + " border p-8 rounded-3xl"}>
                    <h3 className="text-xl font-bold mb-4 text-green-400">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.technicalSkills.map((skill, i) => (<span key={i} className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm">{skill}</span>))}
                    </div>
                  </div>
                  <div className={card + " border p-8 rounded-3xl"}>
                    <h3 className="text-xl font-bold mb-4 text-red-400">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missingSkills.map((skill, i) => (<span key={i} className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm">{skill}</span>))}
                    </div>
                  </div>
                </div>
                <div className={card + " border p-8 rounded-3xl"}>
                  <h3 className="text-xl font-bold mb-4 text-yellow-400">Improvements</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {result.improvements.map((item, i) => (
                      <div key={i} className={"flex items-start gap-3 p-3 rounded-xl " + (darkMode ? "bg-slate-800" : "bg-gray-50")}>
                        <span className="text-yellow-400 mt-1">-</span><span className={subtext}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={card + " border p-8 rounded-3xl"}>
                  <h3 className="text-xl font-bold mb-4 text-purple-400">Best Job Roles</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {result.jobRoles.map((role, i) => (
                      <div key={i} className={"p-4 rounded-2xl " + (darkMode ? "bg-slate-800" : "bg-gray-50")}>
                        <p className="font-semibold mb-3">{role}</p>
                        <div className="flex gap-2">
                          <a href={"https://www.linkedin.com/jobs/search/?keywords=" + encodeURIComponent(role)} target="_blank" rel="noreferrer" className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-lg text-sm text-white">LinkedIn</a>
                          <a href={"https://indeed.com/jobs?q=" + encodeURIComponent(role)} target="_blank" rel="noreferrer" className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-lg text-sm text-white">Indeed</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === "match" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-2">Job Description Matcher</h2>
              <p className={subtext}>See how well your resume matches a job description</p>
            </div>
            <div className={card + " border p-10 rounded-3xl mb-6"}>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Upload Resume</h3>
                  <div className={"border-2 border-dashed " + (darkMode ? "border-slate-700" : "border-gray-300") + " rounded-2xl p-8 text-center"}>
                    <input type="file" accept=".pdf" onChange={(e) => setMatchFile(e.target.files[0])} />
                    {matchFile && <p className="text-green-400 mt-2">Selected: {matchFile.name}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">Paste Job Description</h3>
                  <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." rows={8} className={"w-full p-4 rounded-2xl border " + inputBg + " resize-none outline-none"} />
                </div>
              </div>
              <button onClick={matchResume} disabled={matchLoading} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-4 rounded-2xl font-semibold text-lg text-white">
                {matchLoading ? "Matching..." : "Match Resume with JD"}
              </button>
            </div>
            {matchResult && (
              <div className="grid gap-6">
                <div className={card + " border p-8 rounded-3xl"}>
                  <h3 className="text-xl font-bold mb-4 text-blue-400">Match Score</h3>
                  <div className="flex items-center gap-6">
                    <p className="text-7xl font-bold">{matchResult.matchScore}</p>
                    <div className="flex-1">
                      <div className={"w-full " + (darkMode ? "bg-slate-700" : "bg-gray-200") + " rounded-full h-4"}>
                        <div className={"h-4 rounded-full " + (matchNumber >= 80 ? "bg-green-500" : matchNumber >= 60 ? "bg-yellow-500" : "bg-red-500")} style={{ width: matchNumber + "%" }}></div>
                      </div>
                      <p className={subtext + " mt-2"}>Verdict: <span className="font-bold text-white">{matchResult.verdict}</span></p>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={card + " border p-8 rounded-3xl"}>
                    <h3 className="text-xl font-bold mb-4 text-green-400">Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.matchedSkills.map((s, i) => (<span key={i} className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm">{s}</span>))}
                    </div>
                  </div>
                  <div className={card + " border p-8 rounded-3xl"}>
                    <h3 className="text-xl font-bold mb-4 text-red-400">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.missingSkills.map((s, i) => (<span key={i} className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm">{s}</span>))}
                    </div>
                  </div>
                </div>
                <div className={card + " border p-8 rounded-3xl"}>
                  <h3 className="text-xl font-bold mb-4 text-yellow-400">Suggestions</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {matchResult.suggestions.map((s, i) => (
                      <div key={i} className={"flex items-start gap-3 p-3 rounded-xl " + (darkMode ? "bg-slate-800" : "bg-gray-50")}>
                        <span className="text-yellow-400">-</span><span className={subtext}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === "cover" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-2">Cover Letter Generator</h2>
              <p className={subtext}>Generate a professional cover letter from your resume</p>
            </div>
            <div className={card + " border p-10 rounded-3xl mb-6"}>
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Upload Resume</h3>
                  <div className={"border-2 border-dashed " + (darkMode ? "border-slate-700" : "border-gray-300") + " rounded-2xl p-8 text-center"}>
                    <input type="file" accept=".pdf" onChange={(e) => setCoverFile(e.target.files[0])} />
                    {coverFile && <p className="text-green-400 mt-2">Selected: {coverFile.name}</p>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className={subtext + " text-sm mb-1 block"}>Company Name</label>
                      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Google" className={"w-full p-3 rounded-xl border " + inputBg + " outline-none"} />
                    </div>
                    <div>
                      <label className={subtext + " text-sm mb-1 block"}>Job Title</label>
                      <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" className={"w-full p-3 rounded-xl border " + inputBg + " outline-none"} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">Paste Job Description</h3>
                  <textarea value={coverJD} onChange={(e) => setCoverJD(e.target.value)} placeholder="Paste the job description here..." rows={10} className={"w-full p-4 rounded-2xl border " + inputBg + " resize-none outline-none"} />
                </div>
              </div>
              <button onClick={generateCoverLetter} disabled={coverLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-4 rounded-2xl font-semibold text-lg text-white">
                {coverLoading ? "Generating..." : "Generate Cover Letter"}
              </button>
            </div>
            {coverLetter && (
              <div className={card + " border p-8 rounded-3xl"}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-green-400">Your Cover Letter</h3>
                  <button onClick={downloadCoverLetter} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm text-white">Download PDF</button>
                </div>
                <div className={"p-6 rounded-2xl " + (darkMode ? "bg-slate-800" : "bg-gray-50") + " whitespace-pre-wrap " + subtext + " leading-relaxed"}>
                  {coverLetter}
                </div>
              </div>
            )}
          </div>
        )}

        {activePage === "interview" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-2">Interview Prep</h2>
              <p className={subtext}>Get AI-generated interview questions based on your resume</p>
            </div>
            <div className={card + " border p-10 rounded-3xl mb-6"}>
              <div className={"border-2 border-dashed " + (darkMode ? "border-slate-700" : "border-gray-300") + " rounded-2xl p-8 text-center"}>
                <input type="file" accept=".pdf" onChange={(e) => setInterviewFile(e.target.files[0])} className="mb-4" />
                {interviewFile && <p className="text-green-400 mt-2 mb-4">Selected: {interviewFile.name}</p>}
                <br />
                <button onClick={generateInterviewQuestions} disabled={interviewLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-10 py-4 rounded-2xl font-semibold text-lg text-white">
                  {interviewLoading ? "Generating..." : "Generate Interview Questions"}
                </button>
              </div>
            </div>
            {interviewQuestions && (
              <div className="grid gap-6">
                {[
                  { key: "technical", label: "Technical Questions", color: "text-blue-400", bg: "bg-blue-900", textColor: "text-blue-300" },
                  { key: "behavioral", label: "Behavioral Questions", color: "text-purple-400", bg: "bg-purple-900", textColor: "text-purple-300" },
                  { key: "roleSpecific", label: "Role Specific Questions", color: "text-green-400", bg: "bg-green-900", textColor: "text-green-300" },
                ].map((section) => (
                  <div key={section.key} className={card + " border p-8 rounded-3xl"}>
                    <h3 className={"text-xl font-bold mb-4 " + section.color}>{section.label}</h3>
                    <div className="grid gap-3">
                      {interviewQuestions[section.key]?.map((q, i) => (
                        <div key={i} className={"flex items-start gap-3 p-4 rounded-xl " + (darkMode ? "bg-slate-800" : "bg-gray-50")}>
                          <span className={section.bg + " " + section.textColor + " px-2 py-1 rounded-lg text-xs font-bold"}>Q{i + 1}</span>
                          <span className={subtext}>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activePage === "chat" && (
          <div className="flex flex-col" style={{ height: "85vh" }}>
            <div className="mb-6">
              <h2 className="text-4xl font-bold mb-2">AI Chat Coach</h2>
              <p className={subtext}>Ask anything about resumes, jobs, or career advice</p>
            </div>
            <div className={card + " border rounded-3xl flex flex-col flex-1 overflow-hidden"}>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={"max-w-2xl px-5 py-3 rounded-2xl " + (msg.role === "user" ? "bg-blue-600 text-white" : darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-800")}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className={"px-5 py-3 rounded-2xl animate-pulse " + (darkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500")}>
                      AI is thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className={"p-4 border-t " + (darkMode ? "border-slate-700" : "border-gray-200")}>
                <div className="flex gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                    placeholder="Ask me anything about your resume..."
                    className={"flex-1 p-4 rounded-2xl border " + inputBg + " outline-none"}
                  />
                  <button onClick={sendChatMessage} disabled={chatLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-4 rounded-2xl font-semibold text-white">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === "history" && (
          <div>
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-2">Resume History</h2>
              <p className={subtext}>All your past resume analyses</p>
            </div>
            {history.length === 0 ? (
              <div className={card + " border p-10 rounded-3xl text-center"}>
                <p className={subtext}>No analyses yet. Upload a resume to get started!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {history.map((item, i) => (
                  <div key={item.id} className={card + " border p-8 rounded-3xl"}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Analysis #{history.length - i}</h3>
                        <p className={subtext + " text-sm mt-1"}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={"px-4 py-2 rounded-xl " + (parseInt(item.analysis.atsScore) >= 80 ? "bg-green-900 text-green-300" : parseInt(item.analysis.atsScore) >= 60 ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300")}>
                          <span className="font-bold">{item.analysis.atsScore}</span>
                        </div>
                        <button onClick={() => downloadPDF(item.analysis)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm text-white">Download PDF</button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-green-400 font-semibold mb-2 text-sm">Technical Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {item.analysis.technicalSkills.slice(0, 4).map((s, j) => (<span key={j} className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs">{s}</span>))}
                          {item.analysis.technicalSkills.length > 4 && <span className={subtext + " text-xs py-1"}>+{item.analysis.technicalSkills.length - 4} more</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-red-400 font-semibold mb-2 text-sm">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {item.analysis.missingSkills.slice(0, 4).map((s, j) => (<span key={j} className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-xs">{s}</span>))}
                        </div>
                      </div>
                      <div>
                        <p className="text-purple-400 font-semibold mb-2 text-sm">Job Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {item.analysis.jobRoles.slice(0, 3).map((r, j) => (<span key={j} className="bg-purple-900 text-purple-300 px-2 py-1 rounded-full text-xs">{r}</span>))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
