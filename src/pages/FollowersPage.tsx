import { useEffect } from "react";
import Header from "../components/header/Header";
import Followers from "../modules/feed/components/feed/Followers";

function FollowersPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main
      className="min-h-screen w-screen mx-auto flex flex-col bg-white text-ui-90 relative"
      style={{ maxWidth: "430px" }}
    >
      <div className="flex-grow overflow-y-auto pb-16">
        <div className="px-3 py-5">
          <Header />
        </div>
        <div className="px-3">
          <Followers />
        </div>
      </div>
    </main>
  );
}

export default FollowersPage;
