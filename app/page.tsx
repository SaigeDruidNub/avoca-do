import NextImage from "next/image";
import { FaLeaf, FaGlobe, FaUsers } from "react-icons/fa";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-between bg-primary text-secondary-dark">
      <header className="w-full flex flex-col items-center py-10 bg-primary text-secondary">
        <div className="flex items-center gap-4">
          <NextImage
            src="/logo.png"
            alt="Avoca-do logo"
            width={400}
            height={200}
          />
        </div>
        <p className="mt-4 text-lg sm:text-2xl font-medium max-w-xl text-center">
          Find your people.{" "}
          <span className="text-accent">Share your passions.</span> Connect with
          like-minded friends on Avoca-do, the social platform for discovering
          and building communities around your interests.
        </p>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12 gap-16">
        <section className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-secondary/10 rounded-xl p-6 flex flex-col items-center shadow-md">
            <FaGlobe size={40} className="text-accent" />
            <h2 className="mt-4 text-xl font-bold text-secondary-dark">
              Discover
            </h2>
            <p className="mt-2 text-center text-secondary-dark/80">
              Explore communities and topics that match your unique interests.
            </p>
          </div>
          <div className="bg-secondary/10 rounded-xl p-6 flex flex-col items-center shadow-md">
            <FaUsers size={40} className="text-accent" />
            <h2 className="mt-4 text-xl font-bold text-secondary-dark">
              Connect
            </h2>
            <p className="mt-2 text-center text-secondary-dark/80">
              Meet new friends, join groups, and chat with people who share your
              passions.
            </p>
          </div>
          <div className="bg-secondary/10 rounded-xl p-6 flex flex-col items-center shadow-md">
            <FaLeaf size={40} className="text-accent" />
            <h2 className="mt-4 text-xl font-bold text-secondary-dark">Grow</h2>
            <p className="mt-2 text-center text-secondary-dark/80">
              Build your own community and help others find their place.
            </p>
          </div>
        </section>

        <a
          href="/login"
          className="mt-8 px-8 py-4 rounded-full bg-accent text-white text-lg font-semibold shadow-lg hover:bg-secondary-dark transition-colors"
        >
          Login
        </a>
      </main>

      <footer className="w-full py-6 flex flex-col items-center bg-primary-dark text-secondary text-sm gap-2">
        <span>
          &copy; {new Date().getFullYear()} Avoca-do. All rights reserved.
        </span>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">
            About
          </a>
          <a href="#" className="hover:underline">
            Contact
          </a>
          <a href="#" className="hover:underline">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}
