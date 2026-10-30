import logo from "../../assets/logo.png";

export default function Sidebar({ open, onToggle }) {
  return (
    <>
      <aside
        className={`vertical-panel${open ? " open" : ""}`}
        id="sidebar"
        aria-label="Điều hướng chính"
      >
        <div className="sidebar-header">
          <div className="panel-logo">
            <img src={logo} alt="" />
            <h2>NutriGen</h2>
          </div>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => onToggle(false)}
            aria-label="Đóng menu"
          >
            ×
          </button>
        </div>
        <nav className="panel-menu" aria-label="Menu chính">
          <a href="#" className="active" aria-current="page">
            Tạo nhãn
          </a>
          <a href="#">Quản lý nhãn đã tạo</a>
        </nav>
        <div className="panel-footer">
          <a href="#">Đăng xuất</a>
        </div>
      </aside>

      <button
        className={`sidebar-overlay${open ? " visible" : ""}`}
        type="button"
        aria-label="Đóng menu"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => onToggle(false)}
      />
    </>
  );
}
