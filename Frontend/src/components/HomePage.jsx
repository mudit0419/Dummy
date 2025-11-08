
import Description from './Description'
import Explore from './Explore'
 import AboutUsSection from './AboutUs'
 import Footer from './Footer'
import FAQ from './Faq.jsx';
import UserGuidedFlow from './UserGuidedFlow.jsx';


function HomePage() {
  return (
    // <>
        <div className="app-container">   
            <div className='content'>
                <Description/>
                <Explore/>
                <AboutUsSection/>
                <FAQ/>
                <Footer/> 
            </div>
        </div>
    // </>
    
 
  );
}

export default HomePage