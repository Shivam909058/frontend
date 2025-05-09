import Footer from "../components/shakty_homepage_components/Footer";
import { TERMS_SERVICES } from "../constant/terms_services";
import Header from "../components/header/Header";

function TermsAndServices() {
  return (
    <div className="bg-white items-center mx-auto max-w-[714px] min-h-screen justify-center">
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>
      <div className="mt-14">
        <section className="px-7 pb-16 pt-10 border-b-1 border-ui-50 border-solid rounded-t-4xl border-t-0 shadow-2xl">
          <span className="text-h3 font-lexend font-semibold text-black">
            Terms of Services
          </span>
          <div className="text-h6 font-lexend font-normal text-black mt-2">
            Effective Date: October 16, 2024
          </div>
          <div className="flex flex-col gap-12 mt-9">
            {TERMS_SERVICES.map((item) => {
              return (
                <div key={item.id} className="flex flex-col gap-2">
                  <span className="text-h5 font-lexend font-semibold text-black">
                    {item.id + 1}. {item.title}
                  </span>
                  <p className="text-h5 font-lexend font-normal text-black">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default TermsAndServices;
