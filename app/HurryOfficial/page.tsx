"use client";

import Image from "next/image";
import {
  Menu,
  MessageCircle,
  Upload,
  Link as LinkIcon,
  Theater,
  Laugh,
  Mic,
  Users,
} from "lucide-react";

export default function HurryOfficial() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-black/10 backdrop-blur-md px-5 py-4 shadow-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Hurry Logo"
            width={42}
            height={42}
            className="h-9 w-9 object-contain rounded-xl"
          />
          <span className="text-2xl font-bold tracking-wide text-white">Hurry</span>
        </div>

        <button
          aria-label="Menu"
          className="text-white transition hover:scale-110"
        >
          <Menu size={29} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 py-12 md:px-8">
        
        {/* 1. Hero Section Card */}
        <section className="mx-auto mb-10 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-16 text-center shadow-2xl">
          {/* Top Blue Glow */}
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/30 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="Hurry App"
              width={100}
              height={100}
              className="mb-8 h-24 w-24 object-contain rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.4)]"
            />

            <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-6xl">
              Hurry - Chat,
              <br />
              Share, Connect
            </h1>

            <p className="max-w-xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
              Hurry is not just another social app—it's a vibrant stage for
              creative souls.
            </p>
          </div>
        </section>

        {/* 2. Creative Stage Card - (Text Left, 1 Image Right Corner) */}
        <section className="mx-auto mb-10 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/20 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div className="md:w-3/5">
              <h2 className="mb-4 text-3xl font-bold text-white">Creative Stage</h2>
              <p className="text-lg font-light leading-relaxed text-gray-300">
                Dive into a world where theater and comedy thrive. Share your moments, from backstage snippets to stand-up clips, and connect with like-minded enthusiasts.
              </p>
            </div>
            {/* 1 Image right side m kar di */}
            <div className="md:w-2/5 flex justify-center md:justify-end">
              <ScreenBox text="App Screen 1" large />
            </div>
          </div>
        </section>

        {/* 3. Dynamic Socializing Card - (Text Left, 1 Image Right Corner) */}
        <section className="mx-auto mb-10 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/20 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div className="md:w-3/5">
              <h2 className="mb-4 text-3xl font-bold text-white">Dynamic Socializing</h2>
              <p className="text-lg font-light leading-relaxed text-gray-300">
                Beyond posting updates, Hurry makes socializing dynamic and personal. Engage in lively video chats about the latest shows, or dive into 1-on-1 private conversations to build deeper connections.
              </p>
            </div>
            {/* 1 Image right side m kar di */}
            <div className="md:w-2/5 flex justify-center md:justify-end">
              <ScreenBox text="App Screen 2" large />
            </div>
          </div>
        </section>

        {/* 4. Find Your Crowd Card - (Text Left, 1 Image Right Corner) */}
        <section className="mx-auto mb-10 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/20 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div className="md:w-3/5">
              <h2 className="mb-4 text-3xl font-bold text-white">Find Your Crowd</h2>
              <p className="mb-6 text-lg font-light leading-relaxed text-gray-300">
                Whether you're discussing a punchline or sharing your own
                stories, Hurry helps you find your crowd and express yourself
                freely.
              </p>
              <p className="text-lg font-medium text-white">
                Join Hurry and make your day!
              </p>
            </div>
            <div className="md:w-2/5 flex justify-center md:justify-end">
              <ScreenBox text="App Screen 3" large />
            </div>
          </div>
        </section>

        {/* 5. Key Features Card */}
        <section className="mx-auto mb-10 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/20 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <SectionTitle title="Key Features" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FeatureCard
                icon={<MessageCircle size={32} />}
                title="Chat"
                text="Engage in lively video chats about the latest shows or dive into 1-on-1 private conversations."
              />

              <FeatureCard
                icon={<Upload size={32} />}
                title="Share"
                text="Share your moments, from backstage snippets to stand-up clips with like-minded enthusiasts."
              />

              <div className="md:col-span-2">
                <FeatureCard
                  icon={<LinkIcon size={32} />}
                  title="Connect"
                  text="Connect with creative souls in a vibrant stage designed for theater and comedy lovers."
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. Community Card */}
        <section className="mx-auto mb-16 max-w-5xl overflow-hidden relative rounded-[32px] bg-[#0a0a0a] p-8 md:p-12 shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-64 w-[150%] -translate-x-1/2 rounded-[100%] bg-blue-600/20 blur-[75px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <SectionTitle title="Join Our Community" />

            <p className="mb-6 text-center text-lg font-light leading-relaxed text-gray-300 md:px-10">
              Hurry is more than an app—it's a home for creative expression.
              Whether you're a theater enthusiast, comedy lover, or just
              someone who appreciates authentic connections, you'll find your
              place here.
            </p>

            <p className="mb-16 text-center text-lg font-light leading-relaxed text-gray-300 md:px-10">
              Share your passion, discover new talents, and build meaningful
              relationships in a space designed for creativity.
            </p>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-4">
              <CommunityItem
                icon={<Theater size={52} />}
                title="Theater Lovers"
                text="Connect with fellow theater enthusiasts"
              />

              <CommunityItem
                icon={<Laugh size={52} />}
                title="Comedy Fans"
                text="Share laughs and discover new comedians"
              />

              <CommunityItem
                icon={<Mic size={52} />}
                title="Performers"
                text="Showcase your talent and get feedback"
              />

              <CommunityItem
                icon={<Users size={52} />}
                title="Community"
                text="Build meaningful connections"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black px-6 py-10 text-center text-sm text-gray-500">
        <p className="mb-4 transition hover:text-white">
          Support: HurrySup@outlook.com
        </p>
        <p>© 2026 Hurry App. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ---------------- Components ---------------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-12 text-center">
      <h2 className="mb-3 text-3xl font-bold text-white">{title}</h2>
      <div className="mx-auto h-1 w-16 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
    </div>
  );
}

function ScreenBox({
  text,
  large = false,
}: {
  text: string;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#141414] text-gray-400 shadow-xl ${
        large ? "h-96 w-48 md:w-64" : "h-80 w-40"
      }`}
    >
      {text}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#141414] p-8 text-center shadow-lg transition-all hover:bg-[#1a1a1a]">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a0a0a] text-blue-500 shadow-inner">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
      <p className="text-sm font-light text-gray-400">{text}</p>
    </div>
  );
}

function CommunityItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center transition hover:scale-105">
      <div className="mb-4 flex justify-center text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
        {icon}
      </div>
      <h4 className="mb-2 text-xl font-bold text-white">{title}</h4>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

