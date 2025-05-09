import { useState } from "react";
import { MainHeader } from "./MainHeader";
import SideDrawer from "./SideDrawer";

const Header = () => {
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  return (
    <>
      <MainHeader
        openDrawer={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
        isOpen={isSideDrawerOpen}
      />
      <SideDrawer open={isSideDrawerOpen} setOpen={setIsSideDrawerOpen} />
    </>
  );
};

export default Header;
