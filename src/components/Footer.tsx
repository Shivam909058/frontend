function Footer() {
  return (
    <div
      id="footer"
      className="flex flex-col justify-center items-center py-6 gap-4 bg-white width-full"
      style={{ zIndex: 1000 }}
    >
      <div className="flex flex-row gap-6">
        <a href="https://instagram.com/gowandergals" target="_blank">
          <img
            src={"/assets/instagram.svg"}
            alt="instagram image"
            width={10}
            height={10}
            className="w-5 h-5"
          />
        </a>
        <a href="mailto:karthik@instalane.co">
          <img
            src={"/assets/e-mail.svg"}
            alt="mail image"
            width={10}
            height={10}
            className="w-5 h-5"
          />
        </a>
      </div>
      <div className="flex flex-row gap-1">
        <span className="text-black font-lexend font-normal text-h6-m">ⓒ </span>
        <span className="text-black font-lexend font-normal text-h6-m">
          2024 | Instalane Internet Pvt Ltd
        </span>
      </div>
      <div className="flex flex-row gap-1">
        <a
          href="about-us"
          className="text-black font-lexend font-normal text-h5-m"
        >
          About Us
        </a>
        <span className="text-black font-lexend font-normal text-h5-m">
          {" "}
          |{" "}
        </span>
        <a
          href="privacy"
          className="text-black font-lexend font-normal text-h5-m"
        >
          Privacy Policy
        </a>
        <span className="text-black font-lexend font-normal text-h5-m">
          {" "}
          |{" "}
        </span>
        <a
          href="tos"
          className="text-black font-lexend font-normal text-h5-m"
        >
          Terms & Services
        </a>
      </div>
    </div>
  );
}

export default Footer;
