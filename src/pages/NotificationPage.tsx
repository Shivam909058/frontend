import Header from "../components/header/Header";
import Notification from "../modules/feed/components/Notification";

function NotificationPage() {
  return (
    <main
      className="min-h-screen w-screen mx-auto flex flex-col bg-white text-ui-90 relative"
      style={{ maxWidth: "430px" }}
    >
      <div className="flex-grow overflow-y-auto">
        <div className="px-3 py-5">
          <Header />
        </div>
        <div className="px-3 pb-20">
          <Notification />
        </div>
      </div>
    </main>
  );
}

export default NotificationPage;
