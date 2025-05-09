import Header from "../components/header/Header";
import Footer from "../components/shakty_homepage_components/Footer";

function AboutUs() {
  return (
    <div className="relative bg-white flex flex-col items-center mx-auto max-w-[714px] min-h-screen justify-center">
      <header className="fixed top-0 w-full z-10 pb-2 bg-white">
        <Header />
      </header>
      <section className="px-9 flex flex-col gap-16 mt-20">
        <div className="flex flex-col gap-3">
          <h1 className="font-lexend font-extrabold text-ui-90 text-h3-m">
            About ShaktyAI
          </h1>
          <p className="font-lexend font-normal text-black text-body leading-[24px]">
            ShaktyAI is your personal, intelligent companion, designed to
            empower your everyday life through the power of AI. Inspired by the
            concept of Shakti, meaning strength and energy, ShaktyAI is here to
            support your journey—whether you’re planning your next adventure,
            managing your daily tasks, or seeking answers to life’s questions.
          </p>
          <p className="font-lexend font-normal text-black text-body leading-[24px]">
            We believe in personalized intelligence that adapts to you—your
            goals, your preferences, and your unique needs. ShaktyAI is more
            than just an app; it’s your trusted ally, learning from your inputs
            to give you smarter, tailored responses that help you navigate work,
            life, and everything in between.
          </p>
          <p className="font-lexend font-normal text-black text-body leading-[24px]">
            Our mission is to provide a platform that enhances your
            decision-making and streamlines your routines, all while keeping
            your privacy and security at the forefront. With ShaktyAI, your data
            is yours. We simply assist you in transforming it into meaningful
            insights when you need it most.
          </p>
          <p className="font-lexend font-normal text-black text-body leading-[24px]">
            At ShaktyAI, we’re passionate about creating a seamless experience
            that integrates into every aspect of your life, powered by AI that
            works for you—quietly in the background, while you remain in
            control.
          </p>
          <p className="font-lexend font-normal text-black text-body leading-[24px]">
            Together, let’s make every moment more intentional, productive, and
            empowered.
          </p>
        </div>
      </section>
      <footer className="bg-darkYellow border-t-0 rounded-t-4xl mt-7 w-full">
        <Footer />
      </footer>
    </div>
  );
}

export default AboutUs;
