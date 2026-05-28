import { useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
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

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
  };

  const sendOTP = async () => {
    if (!phone) { alert("Please enter your phone number"); return; }
    if (!phone.startsWith("+")) { alert("Please include country code e.g. +91XXXXXXXXXX"); return; }
    try {
      setLoading(true);
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      alert("OTP sent to " + phone);
    } catch (error) {
      alert("Error sending OTP: " + error.message);
      window.recaptchaVerifier = null;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) { alert("Please enter OTP"); return; }
    try {
      setLoading(true);
      await confirmationResult.confirm(otp);
    } catch (error) {
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
      <div id="recaptcha-container"></div>
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2">ResumeAI</h1>
        <p className="text-slate-400 mb-8">
          {isForgot ? "Reset your password" : isPhone ? "Login with Phone" : isRegister ? "Create your account" : "Welcome back"}
        </p>

        {isForgot ? (
          <div className="flex flex-col gap-3 mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
            />
            <button onClick={handleForgotPassword} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white">
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            <button onClick={() => setIsForgot(false)} className="text-slate-400 text-sm hover:text-white">
              Back to Login
            </button>
          </div>

        ) : isPhone ? (
          <div className="flex flex-col gap-3 mb-4">
            {!otpSent ? (
              <>
                <input
                  type="tel"
                  placeholder="Phone number e.g. +91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                />
                <button onClick={sendOTP} disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="text-green-400 text-sm">OTP sent to {phone}</p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                />
                <button onClick={verifyOTP} disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white">
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp(""); }}
                  className="text-slate-400 text-sm hover:text-white">
                  Resend OTP
                </button>
              </>
            )}
            <button onClick={() => { setIsPhone(false); setOtpSent(false); setPhone(""); setOtp(""); }}
              className="text-slate-400 text-sm hover:text-white">
              Back to Login
            </button>
          </div>

        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              {isRegister && (
                <input type="text" placeholder="Full Name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none" />
              )}
              <input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none" />
              <input type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none" />
              {!isRegister && (
                <button onClick={() => setIsForgot(true)}
                  className="text-right text-blue-400 text-sm hover:underline">
                  Forgot Password?
                </button>
              )}
              <button onClick={handleEmailAuth} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-3 rounded-xl font-semibold text-white">
                {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
              </button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-semibold w-full hover:bg-gray-100">
                <img src="https://www.google.com/favicon.ico" width="20" />
                Continue with Google
              </button>
              <button onClick={() => setIsPhone(true)}
                className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-2xl font-semibold w-full text-white">
                📱 Continue with Phone
              </button>
            </div>

            <p className="text-slate-400 text-sm mt-6">
              {isRegister ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => setIsRegister(!isRegister)}
                className="text-blue-400 ml-1 hover:underline">
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
