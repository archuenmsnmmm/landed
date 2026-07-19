import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { useAppStore } from "../../store/useAppStore";
import { useState } from "react";

export function SignupPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, name || undefined);
    navigate("/onboarding");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Create your account</h1>
      <p className="mt-2 text-[14px] text-zinc-500">
        Invisible AI for technical interviews — type to ask, no mic needed.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">
            Full name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">
            Work email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-[13px] text-zinc-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-landed-600 hover:text-landed-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
