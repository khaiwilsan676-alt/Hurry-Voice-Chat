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
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Background */}
      <style jsx global>{`
        body {
          margin: 0;
          background: #0f172a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .city-bg {
          background-image:
            linear-gradient(
              rgba(15, 23, 42, 0.86),
              rgba(15, 23, 42, 0.98)
            ),
            url("https://images.unsplash.com/photo-1477959858617-679af05371a5?q=80&w=2000&auto=format&fit=crop");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
      `}</style>

      <div className="city-bg min-h-screen">
        {/* Navbar */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-blue-600 px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Hurry Logo"
              width={42}
              height={42}
              className="h-9 w-9 object-contain"
            />

            <span className="text-2xl font-bold tracking-wide">
              Hurry
            </span>
          </div>

          <button
            aria-label="Menu"
            className="text-white transition hover:scale-110"
          >
            <Menu size={29} />
          </button>
        </header>

        {/* Main */}
        <main className="px-6 py-12">
          {/* Hero */}
          <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-500 to-blue-200 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <Image
                src="/logo.png"
                alt="Hurry App"
                width={70}
                height={70}
                className="h-16 w-16 object-contain"
              />
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-tight text-blue-300 md:text-6xl">
              Hurry - Chat,
              <br />
              Share, Connect
            </h1>

            <p className="mb-20 max-w-xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
              Hurry is not just another social app—it's a vibrant stage for
              creative souls.
            </p>
          </section>

          {/* About */}
          <section className="mx-auto max-w-4xl">
            <SectionTitle title="About Hurry" />

            {/* Feature 1 */}
            <FeatureSection
              title="Creative Stage"
              text="Dive into a world where theater and comedy thrive. Share your moments, from backstage snippets to stand-up clips, and connect with like-minded enthusiasts."
              screens={["App Screen 1", "App Screen 2"]}
            />

            {/* Feature 2 */}
            <FeatureSection
              title="Dynamic Socializing"
              text="Beyond posting updates, Hurry makes socializing dynamic and personal. Engage in lively video chats about the latest shows, or dive into 1-on-1 private conversations to build deeper connections."
              screens={["App Screen 3", "App Screen 4"]}
            />

            {/* Feature 3 */}
            <div className="mb-20">
              <h3 className="mb-4 text-2xl font-bold text-blue-300">
                Find Your Crowd
              </h3>

              <p className="mb-6 text-lg font-light leading-relaxed text-gray-300">
                Whether you're discussing a punchline or sharing your own
                stories, Hurry helps you find your crowd and express yourself
                freely.
              </p>

              <p className="mb-10 text-lg font-medium text-gray-200">
                Join Hurry and make your day!
              </p>

              <div className="flex justify-center">
                <ScreenBox text="App Screen 5" large />
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section className="mx-auto mb-20 mt-12 max-w-4xl">
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
          </section>

          {/* Community */}
          <section className="mx-auto mb-16 max-w-4xl">
            <SectionTitle title="Join Our Community" />

            <p className="mb-6 text-lg font-light leading-relaxed text-gray-300">
              Hurry is more than an app—it's a home for creative expression.
              Whether you're a theater enthusiast, comedy lover, or just
              someone who appreciates authentic connections, you'll find your
              place here.
            </p>

            <p className="mb-16 text-lg font-light leading-relaxed text-gray-300">
              Share your passion, discover new talents, and build meaningful
              relationships in a space designed for creativity.
            </p>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
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
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-black/60 px-6 py-10 text-center text-sm text-gray-400 backdrop-blur-sm">
          <p className="mb-4 transition hover:text-white">
            Support: HurrySup@outlook.com
          </p>

          <p>© 2026 Hurry App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-16 text-center">
      <h2 className="mb-3 text-3xl font-bold">{title}</h2>

      <div className="mx-auto h-1 w-16 rounded-full bg-blue-300" />
    </div>
  );
}

function FeatureSection({
  title,
  text,
  screens,
}: {
  title: string;
  text: string;
  screens: string[];
}) {
  return (
    <div className="mb-20">
      <h3 className="mb-4 text-2xl font-bold text-blue-300">{title}</h3>

      <p className="mb-8 text-lg font-light leading-relaxed text-gray-300">
        {text}
      </p>

      <div className="flex justify-center gap-4 overflow-x-auto pb-4">
        {screens.map((screen) => (
          <ScreenBox key={screen} text={screen} />
        ))}
      </div>
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
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-gray-700 bg-[#1e293b] text-gray-500 shadow-xl ${
        large ? "h-96 w-48" : "h-80 w-40"
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
    <div className="rounded-3xl border border-gray-700 bg-[#1e293b]/70 p-8 text-center shadow-lg backdrop-blur-md transition-all hover:border-blue-300">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800 text-white shadow-inner">
        {icon}
      </div>

      <h3 className="mb-3 text-xl font-bold">{title}</h3>

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
    <div className="text-center">
      <div className="mb-4 flex justify-center text-blue-300">
        {icon}
      </div>

      <h4 className="mb-2 text-xl font-bold">{title}</h4>

      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
