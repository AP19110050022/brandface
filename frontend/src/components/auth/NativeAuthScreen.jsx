import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Chrome, KeyRound, Loader2, Mail } from "lucide-react";
import { useSSO, useSignIn, useSignUp } from "capacitor-clerk";
import { Logo } from "@/components/Logo";

const CALLBACK_URL = "co.hireavatar.app://auth/callback";

const errorMessage = (errors) => {
  const global = errors?.global?.[0]?.message;
  const fields = Object.values(errors?.fields || {});
  return global || fields[0]?.message || "";
};

const Field = ({ compact = false, label, testid, type = "text", value, onChange, inputMode }) => (
  <label className={compact ? "block" : "block text-sm font-bold text-white/90"}>
    <span className={compact ? "sr-only" : ""}>{label}</span>
    <input
      data-testid={testid}
      type={type}
      inputMode={inputMode}
      autoCapitalize="none"
      autoComplete={type === "password" ? "current-password" : "email"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      placeholder={compact ? label : undefined}
      className={compact
        ? "h-12 w-full bg-transparent px-4 text-base text-white outline-none placeholder:text-white/45"
        : "mt-2 h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-base text-white outline-none transition-[border-color,background-color] placeholder:text-white/45 focus:border-[#FF5FA2] focus:bg-white/15"}
    />
  </label>
);

const AuthFrame = ({ children, mode, onBack }) => (
  <div className="native-auth-screen min-h-screen px-5 text-white">
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={onBack}
        data-testid="native-auth-back-button"
        aria-label="Back to HireAvatar home"
        className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 transition-[background-color,transform] active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="mt-7">
        <Logo size="text-[30px]" />
        <h1 className="mt-6 text-[28px] font-extrabold leading-tight">
          {mode === "sign-up" ? "Create your account." : "Sign in to HireAvatar."}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {mode === "sign-up"
            ? "One account to become a presenter, hire one, or do both."
            : "Your conversations, offers, and creator work are waiting."}
        </p>
      </div>
      <div className="mt-6 rounded-[24px] border border-white/15 bg-[#170E3B]/70 p-4 shadow-[0_16px_36px_rgba(5,2,24,.35)]">
        {children}
      </div>
    </div>
  </div>
);

const GoogleButton = ({ onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    data-testid="native-auth-google-button"
    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-[#261567] transition-[transform,background-color] active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
    {loading ? "Opening Google…" : "Continue with Google"}
  </button>
);

const ErrorText = ({ children }) => (
  <p data-testid="native-auth-error" className="mt-3 text-sm font-semibold text-[#FFD4E5]" role="alert">
    {children}
  </p>
);

export default function NativeAuthScreen({ mode }) {
  const navigate = useNavigate();
  const { signIn, errors: signInErrors, fetchStatus: signInStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState("");
  const [formError, setFormError] = useState("");
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);

  const complete = async (resource) => {
    await resource.finalize({
      navigate: () => navigate("/app", { replace: true }),
    });
  };

  const continueWithGoogle = async () => {
    setSsoError("");
    setSsoLoading(true);

    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: CALLBACK_URL,
      });

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        navigate("/app", { replace: true });
      }
    } catch (error) {
      setSsoError(error instanceof Error ? error.message : "Google sign-in could not be completed.");
    } finally {
      setSsoLoading(false);
    }
  };

  const signInWithEmail = async (event) => {
    event.preventDefault();
    setFormError("");
    const result = await signIn?.password({ identifier: email, password });

    if (result?.error || !signIn) {
      return;
    }

    await signIn.reload();
    if (signIn.status === "complete") {
      await complete(signIn);
      return;
    }

    if (signIn.status !== "needs_second_factor") {
      setFormError("This sign-in needs another verification step. Please try Google instead.");
      return;
    }

    const canEmailVerify = signIn.supportedSecondFactors?.some(
      (factor) => factor.strategy === "email_code",
    );
    if (!canEmailVerify) {
      setFormError("Your account needs a verification method that is not available in this app yet.");
      return;
    }

    try {
      await signIn.prepareSecondFactor({ strategy: "email_code" });
      setNeedsSecondFactor(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not send your verification code.");
    }
  };

  const verifySecondFactor = async (event) => {
    event.preventDefault();
    setFormError("");
    const result = await signIn?.attemptSecondFactor({
      strategy: "email_code",
      code,
    });

    if (result?.error || !signIn) {
      return;
    }

    await signIn.reload();
    if (signIn.status === "complete") {
      await complete(signIn);
      return;
    }

    setFormError("That code could not finish sign-in. Request a new code and try again.");
  };

  const createAccount = async (event) => {
    event.preventDefault();
    const result = await signUp?.password({ emailAddress: email, password });

    if (result?.error) {
      return;
    }

    await signUp?.verifications.sendEmailCode();
  };

  const verifyEmail = async (event) => {
    event.preventDefault();
    const result = await signUp?.verifications.verifyEmailCode({ code });

    if (result?.error || signUp?.status !== "complete") {
      return;
    }

    await complete(signUp);
  };

  const isVerification = mode === "sign-up"
    && signUp?.status === "missing_requirements"
    && signUp?.unverifiedFields?.includes("email_address");
  const errors = mode === "sign-up" ? signUpErrors : signInErrors;
  const loading = mode === "sign-up" ? signUpStatus === "fetching" : signInStatus === "fetching";

  if (needsSecondFactor) {
    return (
      <AuthFrame mode={mode} onBack={() => setNeedsSecondFactor(false)}>
        <form onSubmit={verifySecondFactor} data-testid="native-auth-second-factor-form" className="space-y-5">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#B35CFF]/25 text-[#F1DDFF]">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-xl font-extrabold">Verify this device</h2>
            <p className="mt-1 text-sm text-white/70">Enter the code sent to your email address.</p>
          </div>
          <Field
            label="Verification code"
            testid="native-auth-second-factor-code-input"
            inputMode="numeric"
            value={code}
            onChange={setCode}
          />
          {formError && <ErrorText>{formError}</ErrorText>}
          <button
            type="submit"
            disabled={loading}
            data-testid="native-auth-second-factor-submit-button"
            className="cta flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify and continue
          </button>
          <button
            type="button"
            onClick={() => void signIn?.prepareSecondFactor({ strategy: "email_code" })}
            data-testid="native-auth-second-factor-resend-button"
            className="w-full text-sm font-bold text-white/80 underline underline-offset-4"
          >
            Send another code
          </button>
        </form>
      </AuthFrame>
    );
  }

  if (isVerification) {
    return (
      <AuthFrame mode={mode} onBack={() => navigate("/", { replace: true })}>
        <form onSubmit={verifyEmail} data-testid="native-auth-verification-form" className="space-y-5">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#B35CFF]/25 text-[#F1DDFF]">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-xl font-extrabold">Check your inbox</h2>
            <p className="mt-1 text-sm text-white/70">Enter the code sent to {email}.</p>
          </div>
          <Field
            label="Verification code"
            testid="native-auth-verification-code-input"
            inputMode="numeric"
            value={code}
            onChange={setCode}
          />
          {errorMessage(errors) && <ErrorText>{errorMessage(errors)}</ErrorText>}
          <button
            type="submit"
            disabled={loading}
            data-testid="native-auth-verification-submit-button"
            className="cta flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify email
          </button>
          <button
            type="button"
            onClick={() => void signUp?.verifications.sendEmailCode()}
            data-testid="native-auth-resend-code-button"
            className="w-full text-sm font-bold text-white/80 underline underline-offset-4"
          >
            Send another code
          </button>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame mode={mode} onBack={() => navigate("/", { replace: true })}>
      <form
        onSubmit={mode === "sign-up" ? createAccount : signInWithEmail}
        data-testid={`native-auth-${mode}-form`}
        className="space-y-4"
      >
        <GoogleButton onClick={continueWithGoogle} loading={ssoLoading} />
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/45">
          <span className="h-px flex-1 bg-white/15" />
          or with email
          <span className="h-px flex-1 bg-white/15" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[.06]">
          <Field
            compact
            label="Email address"
            testid="native-auth-email-input"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <div className="mx-4 h-px bg-white/15" />
          <Field
            compact
            label="Password"
            testid="native-auth-password-input"
            type="password"
            value={password}
            onChange={setPassword}
          />
        </div>
        {(ssoError || formError || errorMessage(errors)) && (
          <ErrorText>{ssoError || formError || errorMessage(errors)}</ErrorText>
        )}
        <button
          type="submit"
          disabled={loading || ssoLoading}
          data-testid={`native-auth-${mode}-submit-button`}
          className="cta flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {mode === "sign-up" ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => navigate(mode === "sign-up" ? "/sign-in" : "/sign-up")}
          data-testid="native-auth-switch-mode-button"
          className="w-full pt-1 text-sm font-bold text-white/80 underline underline-offset-4"
        >
          {mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </AuthFrame>
  );
}