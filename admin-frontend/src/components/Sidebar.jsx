// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const Sidebar = ({ isOpen, onToggle, navigationLinks, config }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [hoverSubmenu, setHoverSubmenu] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setOpenSubmenu(null);
        setHoverSubmenu(null);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".submenu-container") &&
        !event.target.closest(".menu-item")
      ) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  const isParentActive = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem) => location.pathname === subItem.href);
  };

  const handleMainItemClick = (item, e) => {
    if (item.subItems && item.subItems.length > 0) {
      e.preventDefault();

      if (isMobile) {
        if (!isOpen) {
          onToggle();
          setTimeout(() => {
            setOpenSubmenu(item.name);
          }, 100);
        } else {
          setOpenSubmenu(openSubmenu === item.name ? null : item.name);
        }
      } else {
        if (isOpen) {
          setOpenSubmenu(openSubmenu === item.name ? null : item.name);
        }
      }
    } else {
      setOpenSubmenu(null);
      if (isMobile) onToggle();
    }
  };

  const handleSubitemClick = () => {
    setOpenSubmenu(null);
    setHoverSubmenu(null);
    if (isMobile) onToggle();
  };

  const handleMouseEnter = (item) => {
    if (!isMobile && !isOpen && item.subItems) {
      setHoverSubmenu(item.name);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !isOpen) {
      setHoverSubmenu(null);
    }
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActiveLink(item.href) || isParentActive(item);
    const hasSubitems = item.subItems && item.subItems.length > 0;
    const isSubmenuOpen = openSubmenu === item.name;
    const isHovered = hoverSubmenu === item.name;

    const buttonContent = (
      <>
        <Icon
          className={`relative flex-shrink-0 w-5 h-5 transition-all duration-300 ${
            active
              ? "text-red-500 scale-110"
              : "text-gray-400 group-hover:text-red-500 group-hover:scale-110"
          }`}
        />

        {isOpen && (
          <span className="relative ml-3 transition-all duration-300 truncate text-gray-300 group-hover:text-white">
            {item.name}
          </span>
        )}

        {isOpen && hasSubitems && (
          <ChevronDown
            className={`ml-auto w-4 h-4 transition-transform duration-300 ${
              isSubmenuOpen ? "rotate-180 text-red-500" : "text-gray-400"
            }`}
          />
        )}

        {!isOpen && hasSubitems && (
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
        )}

        {active && isOpen && !hasSubitems && (
          <div className="relative ml-auto w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50 animate-pulse"></div>
        )}
      </>
    );

    const buttonClasses = `group relative flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out ${
      active
        ? "bg-red-900/30 text-red-500 border border-red-500/50 shadow-md shadow-red-500/20"
        : "text-gray-400 hover:bg-gray-700 hover:text-red-500 hover:shadow-md"
    }`;

    const itemElement = hasSubitems ? (
      <button
        onClick={(e) => handleMainItemClick(item, e)}
        onMouseEnter={() => handleMouseEnter(item)}
        onMouseLeave={handleMouseLeave}
        className={buttonClasses}
      >
        {buttonContent}
      </button>
    ) : (
      <Link
        to={item.href}
        onClick={(e) => handleMainItemClick(item, e)}
        className={buttonClasses}
      >
        {buttonContent}
      </Link>
    );

    return (
      <div className="submenu-container">
        {itemElement}

        {/* Desktop collapsed sidebar hover submenu */}
        {!isMobile && !isOpen && isHovered && item.subItems && (
          <div className="absolute left-full top-20 ml-2 w-48 bg-gray-800/95 backdrop-blur-xl shadow-2xl border border-gray-700 rounded-xl overflow-hidden z-[70] transition-all duration-200 animate-in slide-in-from-left-2">
            <div className="p-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.name}
                  to={subItem.href}
                  onClick={handleSubitemClick}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    isActiveLink(subItem.href)
                      ? "bg-red-900/30 text-red-500"
                      : "text-gray-400 hover:bg-gray-700 hover:text-red-500"
                  }`}
                >
                  {subItem.name}
                  {isActiveLink(subItem.href) && (
                    <div className="ml-2 inline-block w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50 animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Desktop expanded sidebar inline submenu */}
        {!isMobile && isOpen && isSubmenuOpen && item.subItems && (
          <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={handleSubitemClick}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActiveLink(subItem.href)
                    ? "bg-red-900/30 text-red-500 border-l-2 border-red-600"
                    : "text-gray-400 hover:bg-gray-700 hover:text-red-500 border-l-2 border-gray-700 hover:border-red-500"
                }`}
              >
                {subItem.name}
                {isActiveLink(subItem.href) && (
                  <div className="ml-2 inline-block w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50 animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Mobile inline submenu */}
        {isMobile && isOpen && isSubmenuOpen && item.subItems && (
          <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.name}
                to={subItem.href}
                onClick={handleSubitemClick}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActiveLink(subItem.href)
                    ? "bg-red-900/30 text-red-500 border-l-2 border-red-600"
                    : "text-gray-400 hover:bg-gray-700 hover:text-red-500 border-l-2 border-gray-700 hover:border-red-500"
                }`}
              >
                {subItem.name}
                {isActiveLink(subItem.href) && (
                  <div className="ml-2 inline-block w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50 animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 md:left-4 top-16 md:top-24 h-[calc(100vh-4rem)] md:h-[calc(100vh-7rem)] bg-gray-800/95 backdrop-blur-xl border border-gray-700 z-50 transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen ? "w-64" : isMobile ? "w-16" : "w-16"
        } ${isMobile ? "rounded-r-2xl" : "rounded-2xl"} ${
          isMobile && !isOpen
            ? "-translate-x-full opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`absolute top-20 w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 hover:shadow-red-500/70 hover:shadow-xl transition-all duration-300 hover:scale-110 z-10 group ${
            isMobile ? (isOpen ? "-right-3" : "right-4") : "-right-3"
          }`}
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="relative flex flex-col h-full">
          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {navigationLinks.map((item) => (
              <div key={item.name} className="menu-item">
                {renderMenuItem(item)}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-2xl">
            {isOpen && (
              <div className="transition-all duration-300">
                <p className="text-xs text-gray-400 text-center">
                  © {new Date().getFullYear()} {config?.systemName || "Admin"}
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  {config?.tagline || "Admin Panel"}
                </p>
              </div>
            )}

            {!isOpen && (
              <div className="flex justify-center">
                <div className="w-6 h-6 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/50">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
