import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

function Login() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.log(error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2">ResumeAI</h1>
        <p className="text-slate-400 mb-8">Analyze your resume with AI</p>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-semibold w-full hover:bg-gray-100"
        >
          <img src="https://www.google.com/favicon.ico" width="20" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
