import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginDrawer } from "@/components/loginDrawer";

export default function ShaktyAi() {
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const isAuthenticated = parsedToken?.user?.email;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      setIsLoginDrawerOpen(true);
    }
  };

  return (
    <div className="main">
      <header>
        <div className="container mx-auto flex flex-col px-4">
          <nav className="flex justify-between items-center py-4">
            <div className="logo">
              <a href="/">
                <img src="/images/logo.svg" alt="ShaktyAI" />
              </a>
            </div>
            <div className="nav-links">
              <ul className="flex items">
                <li className="lg:mx-4">
                  <a
                    className="btn-primary cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Start chatting
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <div className="hero">
            <h1 className="font-cd font-semibold text-4xl lg:text-8xl text-white text-center">
              Your Personal AI
              <br />
              Superpower
            </h1>
            <h3 className="text-xl lg:text-3xl text-white text-center py-8">
              Harness Shakty to Simplify Daily Life
            </h3>
            <div className="flex justify-center">
              <a
                className="btn-primary cursor-pointer"
                onClick={handleGetStarted}
              >
                Start chatting
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="u-wrapper py-10 lg:py-20">
          <div className="c-carousel">
            <Swiper
              modules={[Autoplay]}
              spaceBetween={50}
              slidesPerView={"auto"}
              loop={true}
              speed={8000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
            >
              <SwiperSlide>
                <img
                  src="/images/travel.png"
                  alt="travel"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">Travel</p>
                  <p className="text-base lg:text-xl text-off-black">
                    Plan your perfect trip! Add travel ideas and get tailored
                    tips
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/images/money.png"
                  alt="Finance"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">Finance</p>
                  <p className="text-base lg:text-xl text-off-black">
                    Get smart with money! Add resources, get insights on saving
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/images/work.png"
                  alt="work"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">Work</p>
                  <p className="text-base lg:text-xl text-off-black">
                    Boost your career! Add job links, get guidance to succeed
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/images/bags.png"
                  alt="Lifestyle"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">
                    Lifestyle
                  </p>
                  <p className="text-base lg:text-xl text-off-black">
                    Style up your life! Add fashion finds, get trend tips
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide className="bg-[#f87631]">
                <a
                  className="flex flex-row gap-6 cursor-pointer"
                  onClick={handleGetStarted}
                >
                  <img
                    src="/images/create.png"
                    alt="create"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-4xl font-semibold text-white">
                      Create Your Own Shakty
                    </p>
                  </div>
                </a>
              </SwiperSlide>

              <SwiperSlide>
                <img
                  src="/images/drink.png"
                  alt="drinks"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">
                    Food and Drinks
                  </p>
                  <p className="text-base lg:text-xl text-off-black">
                    Savor new flavors! Add recipes, get dining recommendations
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/images/heart.png"
                  alt="Health & Wellness"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">
                    Health & Wellness
                  </p>
                  <p className="text-base lg:text-xl text-off-black">
                    Support your Health! Add health goals, get motivating advice
                  </p>
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/images/edu.png"
                  alt="Education"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex flex-col">
                  <p className="text-base lg:text-xl font-semibold">
                    Education
                  </p>
                  <p className="text-base lg:text-xl text-off-black">
                    Grow your knowledge! Add study notes, get learning tips
                  </p>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>

        <div className="u-wrapper">
          <div className="c-carousel">
            <Swiper
              modules={[Autoplay]}
              spaceBetween={50}
              slidesPerView={"auto"}
              loop={true}
              speed={8000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                reverseDirection: true,
                pauseOnMouseEnter: true,
              }}
            >
              <div className="swiper-wrapper">
                <SwiperSlide>
                  <img
                    src="/images/edu.png"
                    alt="Education"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">
                      Education
                    </p>
                    <p className="text-base lg:text-xl text-off-black">
                      Grow your knowledge! Add study notes, get learning tips
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/heart.png"
                    alt="Health & Wellness"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">
                      Health & Wellness
                    </p>
                    <p className="text-base lg:text-xl text-off-black">
                      Support your Health! Add health goals, get motivating
                      advice
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/drink.png"
                    alt="drinks"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">
                      Food and Drinks
                    </p>
                    <p className="text-base lg:text-xl text-off-black">
                      Savor new flavors! Add recipes, get dining recommendations
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide className="bg-[#f87631]">
                  <a
                    className="flex flex-row gap-6 cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    <img
                      src="/images/create.png"
                      alt="create"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex flex-col">
                      <p className="text-base lg:text-4xl font-semibold text-white">
                        Create Your Own Shakty
                      </p>
                    </div>
                  </a>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/bags.png"
                    alt="Lifestyle"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">
                      Lifestyle
                    </p>
                    <p className="text-base lg:text-xl text-off-black">
                      Style up your life! Add fashion finds, get trend tips
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/work.png"
                    alt="work"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">Work</p>
                    <p className="text-base lg:text-xl text-off-black">
                      Boost your career! Add job links, get guidance to succeed
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/money.png"
                    alt="Finance"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">
                      Finance
                    </p>
                    <p className="text-base lg:text-xl text-off-black">
                      Get smart with money! Add resources, get insights on
                      saving
                    </p>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src="/images/travel.png"
                    alt="travel"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col">
                    <p className="text-base lg:text-xl font-semibold">Travel</p>
                    <p className="text-base lg:text-xl text-off-black">
                      Plan your perfect trip! Add travel ideas and get tailored
                      tips
                    </p>
                  </div>
                </SwiperSlide>
              </div>
            </Swiper>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 py-10 lg:my-20">
          <div className="lg:w-1/2">
            <h3 className="font-cd text-4xl lg:text-8xl font-normal">
              Why choose <br />
              <strong className="font-semibold text-primary">ShaktyAI</strong>?
            </h3>
            <a
              className="inline-block btn-secondary mt-5 cursor-pointer mb-10"
              onClick={handleGetStarted}
            >
              Start chatting →
            </a>
          </div>
          <div className="flex flex-col justify-end lg:w-1/2">
            <p className="flex flex-row gap-1">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M23.2925 9.94115C23.3193 9.73815 23.3333 9.53515 23.3333 9.33331C23.3333 6.55781 20.8332 4.33065 18.0588 4.70748C17.2503 3.26898 15.7103 2.33331 14 2.33331C12.2897 2.33331 10.7497 3.26898 9.94117 4.70748C7.161 4.33065 4.66667 6.55781 4.66667 9.33331C4.66667 9.53515 4.68067 9.73815 4.7075 9.94115C3.269 10.7508 2.33333 12.2908 2.33333 14C2.33333 15.7091 3.269 17.2491 4.7075 18.0588C4.68059 18.2603 4.66694 18.4634 4.66667 18.6666C4.66667 21.4421 7.161 23.6635 9.94117 23.2925C10.7497 24.731 12.2897 25.6666 14 25.6666C15.7103 25.6666 17.2503 24.731 18.0588 23.2925C20.8332 23.6635 23.3333 21.4421 23.3333 18.6666C23.3333 18.4648 23.3193 18.2618 23.2925 18.0588C24.731 17.2491 25.6667 15.7091 25.6667 14C25.6667 12.2908 24.731 10.7508 23.2925 9.94115ZM12.7808 19.152L8.50267 14.819L10.164 13.181L12.7972 15.848L17.8453 10.8383L19.488 12.495L12.7808 19.152Z"
                  fill="#F87631"
                />
              </svg>
              Query your saved content and get tailored insights
            </p>
            <p className="flex flex-row gap-1 py-5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M23.2925 9.94115C23.3193 9.73815 23.3333 9.53515 23.3333 9.33331C23.3333 6.55781 20.8332 4.33065 18.0588 4.70748C17.2503 3.26898 15.7103 2.33331 14 2.33331C12.2897 2.33331 10.7497 3.26898 9.94117 4.70748C7.161 4.33065 4.66667 6.55781 4.66667 9.33331C4.66667 9.53515 4.68067 9.73815 4.7075 9.94115C3.269 10.7508 2.33333 12.2908 2.33333 14C2.33333 15.7091 3.269 17.2491 4.7075 18.0588C4.68059 18.2603 4.66694 18.4634 4.66667 18.6666C4.66667 21.4421 7.161 23.6635 9.94117 23.2925C10.7497 24.731 12.2897 25.6666 14 25.6666C15.7103 25.6666 17.2503 24.731 18.0588 23.2925C20.8332 23.6635 23.3333 21.4421 23.3333 18.6666C23.3333 18.4648 23.3193 18.2618 23.2925 18.0588C24.731 17.2491 25.6667 15.7091 25.6667 14C25.6667 12.2908 24.731 10.7508 23.2925 9.94115ZM12.7808 19.152L8.50267 14.819L10.164 13.181L12.7972 15.848L17.8453 10.8383L19.488 12.495L12.7808 19.152Z"
                  fill="#F87631"
                />
              </svg>
              Track to-dos, spending, and ideas seamlessly
            </p>
            <p className="flex flex-row gap-1">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M23.2925 9.94115C23.3193 9.73815 23.3333 9.53515 23.3333 9.33331C23.3333 6.55781 20.8332 4.33065 18.0588 4.70748C17.2503 3.26898 15.7103 2.33331 14 2.33331C12.2897 2.33331 10.7497 3.26898 9.94117 4.70748C7.161 4.33065 4.66667 6.55781 4.66667 9.33331C4.66667 9.53515 4.68067 9.73815 4.7075 9.94115C3.269 10.7508 2.33333 12.2908 2.33333 14C2.33333 15.7091 3.269 17.2491 4.7075 18.0588C4.68059 18.2603 4.66694 18.4634 4.66667 18.6666C4.66667 21.4421 7.161 23.6635 9.94117 23.2925C10.7497 24.731 12.2897 25.6666 14 25.6666C15.7103 25.6666 17.2503 24.731 18.0588 23.2925C20.8332 23.6635 23.3333 21.4421 23.3333 18.6666C23.3333 18.4648 23.3193 18.2618 23.2925 18.0588C24.731 17.2491 25.6667 15.7091 25.6667 14C25.6667 12.2908 24.731 10.7508 23.2925 9.94115ZM12.7808 19.152L8.50267 14.819L10.164 13.181L12.7972 15.848L17.8453 10.8383L19.488 12.495L12.7808 19.152Z"
                  fill="#F87631"
                />
              </svg>
              Get suggestions based on your unique preferences
            </p>
          </div>
        </div>

        <div className="container">
          <div className="u-wrapper">
            <div className="c-carousel w-[100%]">
              <Swiper
                modules={[Autoplay]}
                spaceBetween={50}
                slidesPerView={"auto"}
                loop={true}
                speed={8000}
                autoplay={{
                  delay: 0,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                className="m-0"
              >
                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/travel.png" alt="travel" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Help me plan my trip to Goa this summer
                    </p>
                  </a>
                </SwiperSlide>

                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/money.png" alt="money" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Help me plan my budget for the month
                    </p>
                  </a>
                </SwiperSlide>

                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/cal.png" alt="cal" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Help me plan my schedule for my tasks
                    </p>
                  </a>
                </SwiperSlide>

                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/receipe.png" alt="receipe" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Help me find a new recipe for dinner tonight
                    </p>
                  </a>
                </SwiperSlide>

                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/sleep.png" alt="sleep" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Give me some tips for improving my sleep
                    </p>
                  </a>
                </SwiperSlide>

                <SwiperSlide className="flex gap-3 p-4 rounded-xl prompt-card cursor-pointer mt-4 bg-[#fef3ed] border-[2px] border-[#f87631]">
                  <img src="/images/tree.png" alt="tree" />

                  <a onClick={() => handleGetStarted()}>
                    <p className="text-primary text-base lg:text-2xl font-medium">
                      Help me write a poem about the beauty of nature
                    </p>
                  </a>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>

        <div className="py-10 lg:my-20">
          <h3 className="font-cd text-center font-normal text-4xl lg:text-8xl">
            Unlock <span className="text-primary font-bold">ShaktyAI's</span>{" "}
            Powers
          </h3>

          <div className="flex flex-col lg:flex-row gap-5 justify-between pt-10 wave-bg">
            <div className="flex flex-col text-center lg:w-1/3">
              <div className="flex flex-col items-center justify-center pt-8 pb-4">
                <img src="/images/ai.png" alt="AI" className="object-contain" />
              </div>
              <p className="font-cd text-xl lg:text-4xl font-medium pt-3">
                Choose Your Shakty
              </p>
              <p className="text-base lg:text-2xl text-off-black font-medium w-2/3 mx-auto">
                Select the AI specialized for your needs
              </p>
            </div>
            <div className="flex flex-col text-center lg:w-1/3">
              <div className="flex flex-col items-center justify-center pt-8 pb-4">
                <img src="/images/ai.png" alt="AI" className="object-contain" />
              </div>
              <p className="font-cd text-xl lg:text-4xl font-medium pt-3">
                Add Sources
              </p>
              <p className="text-base lg:text-2xl text-off-black font-medium w-2/3 mx-auto">
                Add links, saved reels, notes
              </p>
            </div>
            <div className="flex flex-col text-center lg:w-1/3">
              <div className="flex flex-col items-center justify-center pt-8 pb-4">
                <img src="/images/ai.png" alt="AI" className="object-contain" />
              </div>
              <p className="font-cd text-xl lg:text-4xl font-medium pt-3">
                Choose Your Shakty
              </p>
              <p className="text-base lg:text-2xl text-off-black font-medium w-2/3 mx-auto">
                Ask Shakty AI for plans, insights, advice, and ideas
              </p>
            </div>
          </div>
          <div className="flex justify-center pt-10">
            <a
              className="btn-secondary cursor-pointer"
              onClick={handleGetStarted}
            >
              Try it for free →
            </a>
          </div>
        </div>
      </div>

      <section className="explore-ai">
        <div className="container">
          <div className="py-10 lg:py-20">
            <div>
              <h2 className="font-cd text-4xl lg:text-8xl text-off-white">
                Explore{" "}
                <strong className="font-semibold text-white">ShaktyAI</strong> &{" "}
                <br />
                harness the power of AI
              </h2>
              <a
                className="inline-block btn-primary mt-5 cursor-pointer"
                onClick={handleGetStarted}
              >
                Start chatting & discover smarter planning →
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20">
        <div className="container">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="lg:w-2/5">
              <a href="/">
                <img src="/images/shakty-logo.png" alt="ShaktyAI" />
              </a>
              <p className="text-base lg:text-xl py-4">
                ShaktyAI provides a collection of specialized AIs tailored to
                support your needs. Whether it's finance, travel, productivity,
                or more, chat with a Shakty to help you plan smarter, track
                better, and achieve faster.
              </p>

              <ul className="flex flex-row items-center gap-4 pt-6">
                <li>
                  <a href="https://www.instagram.com/shaktyai/" target="_blank">
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 23 23"
                      fill="none"
                      className="opacity-70"
                    >
                      <path
                        d="M12.1843 0.720459C13.4272 0.723773 14.058 0.730402 14.6027 0.745869L14.817 0.753603C15.0645 0.762441 15.3086 0.773489 15.6036 0.786746C16.7791 0.841986 17.5812 1.02759 18.2849 1.30047C19.0141 1.58109 19.6283 1.96114 20.2426 2.5743C20.8044 3.12658 21.2391 3.79464 21.5164 4.53199C21.7893 5.23574 21.9749 6.03782 22.0302 7.21442C22.0434 7.50829 22.0545 7.75245 22.0633 8.00103L22.0699 8.21536C22.0865 8.75891 22.0931 9.38975 22.0953 10.6326L22.0964 11.4568V12.9041C22.0992 13.7099 22.0907 14.5158 22.071 15.3214L22.0644 15.5357C22.0556 15.7843 22.0445 16.0284 22.0313 16.3223C21.976 17.4989 21.7882 18.2999 21.5164 19.0047C21.2399 19.7425 20.8051 20.4107 20.2426 20.9624C19.6902 21.524 19.0222 21.9587 18.2849 22.2363C17.5812 22.5091 16.7791 22.6947 15.6036 22.75C15.3414 22.7623 15.0792 22.7734 14.817 22.7831L14.6027 22.7898C14.058 22.8052 13.4272 22.813 12.1843 22.8152L11.3601 22.8163H9.91392C9.10771 22.819 8.30151 22.8106 7.49554 22.7909L7.28121 22.7842C7.01894 22.7743 6.75673 22.7629 6.49459 22.75C5.3191 22.6947 4.51702 22.5091 3.81216 22.2363C3.0749 21.9594 2.40711 21.5246 1.85558 20.9624C1.29329 20.4103 0.858202 19.7423 0.580652 19.0047C0.307769 18.301 0.122164 17.4989 0.0669248 16.3223C0.0546161 16.0602 0.0435681 15.798 0.0337811 15.5357L0.0282573 15.3214C0.0078983 14.5158 -0.00130927 13.7099 0.000637465 12.9041V10.6326C-0.00244597 9.82681 0.00565669 9.02097 0.0249429 8.21536L0.0326764 8.00103C0.0415148 7.75245 0.0525626 7.50829 0.0658201 7.21442C0.12106 6.03782 0.306664 5.23684 0.579547 4.53199C0.856976 3.79388 1.29293 3.12561 1.85669 2.5743C2.40808 2.01248 3.07543 1.57776 3.81216 1.30047C4.51702 1.02759 5.31799 0.841986 6.49459 0.786746C6.78847 0.773489 7.03373 0.762441 7.28121 0.753603L7.49554 0.746974C8.30114 0.727345 9.10698 0.718874 9.91282 0.721564L12.1843 0.720459ZM11.0485 6.24441C9.5835 6.24441 8.17846 6.8264 7.14252 7.86234C6.10658 8.89828 5.52459 10.3033 5.52459 11.7684C5.52459 13.2334 6.10658 14.6384 7.14252 15.6744C8.17846 16.7103 9.5835 17.2923 11.0485 17.2923C12.5136 17.2923 13.9186 16.7103 14.9546 15.6744C15.9905 14.6384 16.5725 13.2334 16.5725 11.7684C16.5725 10.3033 15.9905 8.89828 14.9546 7.86234C13.9186 6.8264 12.5136 6.24441 11.0485 6.24441ZM11.0485 8.45399C11.4838 8.45392 11.9148 8.53958 12.3169 8.70607C12.7191 8.87257 13.0845 9.11664 13.3923 9.42436C13.7001 9.73208 13.9443 10.0974 14.111 10.4995C14.2776 10.9016 14.3634 11.3326 14.3635 11.7678C14.3635 12.2031 14.2779 12.6341 14.1114 13.0362C13.9449 13.4384 13.7008 13.8038 13.3931 14.1116C13.0854 14.4194 12.72 14.6636 12.318 14.8302C11.9159 14.9969 11.4849 15.0827 11.0496 15.0827C10.1706 15.0827 9.3276 14.7335 8.70603 14.112C8.08447 13.4904 7.73527 12.6474 7.73527 11.7684C7.73527 10.8893 8.08447 10.0463 8.70603 9.42475C9.3276 8.80318 10.1706 8.45399 11.0496 8.45399M16.8498 4.58723C16.4835 4.58723 16.1323 4.73272 15.8733 4.99171C15.6143 5.25069 15.4688 5.60195 15.4688 5.96821C15.4688 6.33447 15.6143 6.68573 15.8733 6.94472C16.1323 7.20371 16.4835 7.3492 16.8498 7.3492C17.2161 7.3492 17.5673 7.20371 17.8263 6.94472C18.0853 6.68573 18.2308 6.33447 18.2308 5.96821C18.2308 5.60195 18.0853 5.25069 17.8263 4.99171C17.5673 4.73272 17.2161 4.58723 16.8498 4.58723Z"
                        fill="black"
                      />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <ul className="flex flex-col gap-3">
                <li className="text-base lg:text-xl font-semibold">Shaktys</li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Travel
                  </a>
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Finance
                  </a>
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Lifestyle
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <ul className="flex flex-col gap-3">
                <li className="hidden lg:block text-base lg:text-xl font-semibold">
                  &nbsp;
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Health
                  </a>
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Food and Drinks
                  </a>
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={handleGetStarted}
                  >
                    Health & Wellness
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <ul className="flex flex-col gap-3">
                <li className="text-base lg:text-xl font-semibold">Company</li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={() => navigate("/about-us")}
                  >
                    About us
                  </a>
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={() => navigate("/privacy")}
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <ul className="flex flex-col gap-3">
                <li className="hidden lg:block text-base lg:text-xl font-semibold">
                  &nbsp;
                </li>
                <li>
                  <a
                    className="text-base lg:text-xl font-light cursor-pointer"
                    onClick={() => navigate("/tos")}
                  >
                    Terms of Services
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {isLoginDrawerOpen && (
        <LoginDrawer close={() => setIsLoginDrawerOpen(false)} />
      )}
    </div>
  );
}
