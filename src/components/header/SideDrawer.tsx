import { Fragment, ReactElement, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";
import { MainHeader } from "./MainHeader";
// import BottomNav from "../BottomNav";

interface UserDetails {
  id: string;
  name: string;
  profile_picture_url: string;
}

const LogOutConfirmationModal = ({
  isOpen,
  onCancel,
  onDelete,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onDelete: () => void;
}): ReactElement | null => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-lexend">
      <div className="flex flex-col px-7 pt-7 pb-4 text-center bg-white rounded border-0 border-solid shadow-sm border-stone-300 max-w-[300px]">
        <p className="text-[10px] leading-5 text-black ">
          Are you sure you want to logout?
        </p>
        <div className="flex gap-5 justify-between mt-5 text-xs leading-4 whitespace-nowrap">
          <button
            className="justify-center px-6 py-2 text-black rounded-lg border-[1px] border-black border-solid"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="justify-center px-7 py-2 text-white bg-[#F14A58] rounded"
            onClick={onDelete}
          >
            LogOut
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const SideDrawer = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`));
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!token) return;
      const parsedToken = JSON.parse(token);
      const userEmail = parsedToken?.user?.email;

      if (userEmail) {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, profile_picture_url")
          .eq("email", userEmail)
          .single();

        if (!error && data) {
          setUserDetails(data);
        }
      }
    };

    fetchUserDetails();
  }, [token]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const path = e.currentTarget.dataset.path;
    if (path) {
      if (path === "/logout") {
        setIsModalOpen(true);
        setOpen(false);
      } else {
        navigate(path);
        window.location.reload();
        setOpen(false);
      }
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative"
          onClose={() => setOpen(false)}
          style={{ zIndex: 1001 }}
        >
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen lg:w-80">
                    <div className="flex h-full flex-col justify-between overflow-y-scroll bg-white shadow-xl">
                      <div>
                        <div className="mb-8">
                          <MainHeader
                            openDrawer={() => setOpen(false)}
                            isOpen={open}
                          />
                        </div>

                        <button
                          className="flex items-start text-[20px] leading-[58px] font-lexend font-medium text-black pl-8 underline"
                          data-path="/chat-history"
                          onClick={handleButtonClick}
                        >
                          Chat History
                        </button>
                        <button
                          className="flex items-start text-[20px] leading-[58px] font-lexend font-medium text-black pl-8 underline"
                          data-path="/chat"
                          onClick={handleButtonClick}
                        >
                          Start a new chat
                        </button>
                        {token && (
                          <button
                            className="flex items-start text-[20px] leading-[58px] font-lexend font-medium text-black pl-8"
                            data-path="/logout"
                            onClick={handleButtonClick}
                          >
                            Log Out
                          </button>
                        )}
                      </div>
                    </div>
                    {/* {token && <BottomNav />} */}
                    <div className="absolute bottom-3 left-4 z-10 w-11/12">
                      <button
                        className="flex flex-row items-center gap-2 bg-[#F3F3F3] p-2 w-full rounded-md"
                        onClick={() => navigate(`/${userDetails?.id}`)}
                      >
                        <div className="bg-white flex items-center justify-center rounded-full border-ui-90 w-7 h-7 overflow-hidden border-0.8">
                          {userDetails?.profile_picture_url ? (
                            <img
                              src={`${
                                import.meta.env.VITE_SUPABASE_URL
                              }/storage/v1/object/public/img/${
                                userDetails.profile_picture_url
                              }`}
                              alt="user image"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src="/assets/profile.svg"
                              alt="logo image"
                              height={24}
                              width={24}
                            />
                          )}
                        </div>
                        <div>{userDetails?.name}</div>
                      </button>

                      <div className="mt-4 flex flex-col items-start gap-2 px-2">
                        <div className="flex gap-4 justify-start w-full">
                          <a
                            href="https://instagram.com/gowandergals"
                            target="_blank"
                          >
                            <img
                              src={"/assets/instagram.svg"}
                              alt="instagram image"
                              className="w-5 h-5"
                            />
                          </a>
                          <a href="mailto:karthik@instalane.co">
                            <img
                              src={"/assets/e-mail.svg"}
                              alt="mail image"
                              className="w-5 h-5"
                            />
                          </a>
                        </div>
                        <div className="flex flex-row gap-1">
                          <span className="text-black font-lexend font-normal text-[12px]">
                            ⓒ{" "}
                          </span>
                          <span className="text-black font-lexend font-normal text-[12px]">
                            2024 | Instalane Internet Pvt Ltd
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-start w-full text-[12px] text-black font-lexend">
                          <a href="about-us">About Us</a>
                          <span>|</span>
                          <a href="privacy">Privacy Policy</a>
                          <span>|</span>
                          <a href="tos">Terms & Services</a>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <LogOutConfirmationModal
        isOpen={isModalOpen}
        onCancel={handleCancel}
        onDelete={handleLogout}
      />
    </>
  );
};

export default SideDrawer;
