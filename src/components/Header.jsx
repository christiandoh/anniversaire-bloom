import logo from '../assets/logovh.jpg'

function Header() {
  return (
    <header className="app-header py-3 py-md-4">
      <div className="container d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="Logo Vh" className="app-logo" />
          <div>
            <h1 className="app-title mb-0">Anniversaires Bloom ATC</h1>
            <p className="app-subtitle mb-0">
              Célébrons ensemble les anniversaires des Bloomers
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

