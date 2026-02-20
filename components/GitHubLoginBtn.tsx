"use client";

import { SocialButton } from "./SocialButton";
import { Github } from "lucide-react";

export default function GitHubLoginBtn() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;

  const loginWithGithub = () => {
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/github/callback`;

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

    window.location.href = url;
  };

  return (
    <SocialButton
      onClick={loginWithGithub}
      icon={<Github className="h-5 w-5" />}
    >
      Continue with GitHub
    </SocialButton>
  );
}
