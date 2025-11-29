import NotificationBell from "./components/NotificationBell";

function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow">
      
      {/* Left: Menu links */}
      <div className="flex gap-6">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path} 
            className="flex items-center gap-2 text-gray-700 hover:text-black"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Right: Bell + User Menu */}
      <div className="flex items-center gap-4">
        <NotificationBell />    {/* <-- YOUR NOTIFICATION BELL HERE */}
        <UserMenu />
      </div>

    </nav>
  );
}
export default Navbar;