import { useState } from "react";
import { Button } from "./Button";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import ConnectBtn from "../common/ConnectBtn";

const navItems = [
  {
    label: "Developers",
    href: "/developers",
  },
  {
    label: "Projects",
    href: "/projects",
  },
  {
    label: "My NFT",
    href: "/my-profile",
  },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header>
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <a className="text-2xl font-bold" href="/">
            Dolphinder
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navItems.map(item => (
              <a
                href={item.href}
                className="text-white/90 transition-colors duration-200 hover:text-white"
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Connect Button */}

          <ConnectBtn />

          {/* Mobile Menu Button */}
          <button
            className="flex h-6 w-6 flex-col items-center justify-center space-y-1 md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            ></span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col space-y-4 border-t border-white/10 py-4">
            {navItems.map(item => (
              <a
                href={item.href}
                className="py-2 text-white/90 transition-colors duration-200 hover:text-white"
                key={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-white/10 pt-4">
              {/* <ConnectBtn /> */}

              <Button>Join</Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
