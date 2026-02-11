import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import GlassCard from '../components/GlassCard.jsx'
import BirthdayForm from '../components/BirthdayForm.jsx'

function Home() {
  return (
    <div className="app-root d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-4 py-md-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <GlassCard>
                <BirthdayForm />
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Home

