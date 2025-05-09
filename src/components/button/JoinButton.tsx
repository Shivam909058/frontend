interface Props {
  className?: string;
  onClick?: () => void; // Adding onClick as an optional prop
  blueIcon?: boolean;
  textColor?: string;
}

function JoinButton({ className, onClick, blueIcon = false, textColor='white' }: Props) {
  return (
    <button
      className={`bg-orange py-3 px-8 flex flex-row items-center justify-center gap-4 self-center text-${textColor} font-lexend font-medium ${className}`}
      onClick={onClick} // Using onClick here
    >
      Login to WanderGals
      {blueIcon ? (
        <img
          src={"/assets/side_arrow_blue.svg"}
          alt="link img"
          width={10}
          height={10}
        />
      ) : (
        <img
          src={"/assets/side_arrow.svg"}
          alt="link img"
          width={10}
          height={10}
        />
      )}
    </button>
  );
}

export default JoinButton;
