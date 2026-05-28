import { useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) { alert("Please enter email and password"); return; }
    if (isRegister && !name) { alert("Please enter your name"); return; }
    try {
      setLoading(true);
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { alert("Please enter your email"); return; }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent to " + email + ". Check your inbox!");
      setIsForgot(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2">ResumeAI</h1>
        <p className="text-slate-400 mb-8">
          {isForgot ? "Reset your password" : isRegister ? "Create your account" : "Welcome back"}
        </p>

        {isForgot ? (
          // Forgot Password Form
          <div className="flex flex-col gap-3 mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
            />
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white"
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            <button
              onClick={() => setIsForgot(false)}
              className="text-slate-400 text-sm hover:text-white"
            >
              Back to Login
            </button>
          </div>
        ) : (
          // Login / Register Form
          <>
            <div className="flex flex-col gap-3 mb-4">
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
              />
              {!isRegister && (
                <button
                  onClick={() => setIsForgot(true)}
                  className="text-right text-blue-400 text-sm hover:underline"
                >
                  Forgot Password?
                </button>
              )}
              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white"
              >
                {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
              </button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-semibold w-full hover:bg-gray-100"
            >
              <img src="https://www.google.com/favicon.ico" width="20" />
              Continue with Google
            </button>

            <p className="text-slate-400 text-sm mt-6">
              {isRegister ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-400 ml-1 hover:underline"
              >
                {isRegister ? "Login" : "Register"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
