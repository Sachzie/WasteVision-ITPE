import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../assets/css/about.css';
import hero from '../assets/img/group-multi-colored-trash-cans-are-sidewalk_921860-178361.jpg';
import img1 from '../assets/img/img1.jpg'
import alt from '../assets/img/OIP.jpg'
import hazel from '../assets/img/hazel.jpg'
import sachzie from '../assets/img/sachzie.jpg'
import michael from '../assets/img/michael.jpg'
import drew from '../assets/img/drew.jpg'

const About = ({ isAuthenticated, setIsAuthenticated }) => {
  return (
    <div className="about-container">
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About WasteVision</h1>
          <p>A Student Innovation Project for Smart Waste Management</p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision-section">
        <div className="mission-vision-container">
          <div className="mission-box">
            <div className="icon-wrapper mission-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <h2>Our Mission</h2>
            <p>
              To develop an accessible AI-powered solution that helps students and 
              communities properly classify waste materials. Our project aims to make 
              recycling easier and more effective by using technology everyone can use—
              just take a photo, and our system tells you exactly how to dispose of it.
            </p>
          </div>
          
          <div className="mission-box">
            <div className="icon-wrapper vision-icon">
              <i className="fas fa-eye"></i>
            </div>
            <h2>Our Vision</h2>
            <p>
              We envision a campus and community where waste sorting becomes second 
              nature through smart technology. By combining our academic knowledge 
              with practical AI solutions, we hope to inspire other students to use 
              technology for environmental good and create lasting change in waste 
              management practices.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-content">
          <div className="story-text">
            <span className="section-tag">Our Story</span>
            <h2>From Idea to Working Solution</h2>
            <p>
              WasteVision was born from a simple observation by students at 
              Technological University of the Philippines: waste segregation is 
              confusing. Even with clearly labeled bins, many people struggle to 
              know which waste goes where.
            </p>
            <p>
              Our team decided to tackle this problem by combining what we learned 
              in Computer Science with real-world environmental challenges. We spent 
              months researching AI models, collecting and labeling waste images, 
              training our detection system, and building a user-friendly web interface.
            </p>
            <p>
              This isn't just a school assignment—it's our contribution to solving 
              a real environmental problem. We're proving that student-led innovations 
              can create practical solutions that help people make better choices every day.
            </p>
          </div>
          <div className="story-image">
            <img 
              src={hero}
              alt="Student innovation in sustainability" 
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <span className="section-tag">Our Values</span>
        <h2>What Drives Our Project</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <h3>Environmental Impact</h3>
            <p>
              We're passionate about making a real difference. Every correctly 
              sorted piece of waste contributes to a cleaner environment and 
              more sustainable future.
            </p>
          </div>
          
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-lightbulb"></i>
            </div>
            <h3>Practical Learning</h3>
            <p>
              As students, we believe in learning by building. This project let us 
              apply AI, web development, and environmental science to solve a 
              real-world problem.
            </p>
          </div>
          
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3>Community First</h3>
            <p>
              We built this for our fellow students and community. Making waste 
              sorting easier for everyone is what drives our development decisions.
            </p>
          </div>
          
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Simplicity</h3>
            <p>
              Proper waste disposal shouldn't be complicated. Just snap a photo, 
              and our AI tells you exactly what to do—no manuals needed.
            </p>
          </div>
          
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-hands-helping"></i>
            </div>
            <h3>Accessibility</h3>
            <p>
              Everyone should have access to smart waste sorting. Our tool works 
              on any device with a camera and internet connection.
            </p>
          </div>
          
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Continuous Growth</h3>
            <p>
              We're constantly improving our AI model and adding new features based 
              on user feedback and testing results.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <div className="technology-content">
          <div className="technology-image">
            <img 
              src={img1}
              alt="AI Technology" 
            />
          </div>
          <div className="technology-text">
            <span className="section-tag">Our Technology</span>
            <h2>How WasteVision Works</h2>
            <p>
              We implemented YOLOv5, a state-of-the-art object detection model, as 
              the core of our waste classification system. We trained it on hundreds 
              of waste images to accurately recognize different materials—plastic, 
              paper, metal, glass, organic waste, and more. The AI analyzes your 
              photo and provides instant classification results!
            </p>
            <div className="tech-features">
              <div className="tech-feature">
                <i className="fas fa-check-circle"></i>
                <span>Custom-trained on 500+ waste images</span>
              </div>
              <div className="tech-feature">
                <i className="fas fa-check-circle"></i>
                <span>Real-time image analysis</span>
              </div>
              <div className="tech-feature">
                <i className="fas fa-check-circle"></i>
                <span>Works on mobile & desktop</span>
              </div>
              <div className="tech-feature">
                <i className="fas fa-check-circle"></i>
                <span>Detects multiple waste items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <span className="section-tag">Project Impact</span>
        <h2>What We've Achieved</h2>
        <div className="impact-stats">
          <div className="impact-stat">
            <h3>500+</h3>
            <p>Test Classifications</p>
          </div>
          <div className="impact-stat">
            <h3>50+</h3>
            <p>Beta Testers</p>
          </div>
          <div className="impact-stat">
            <h3>85%</h3>
            <p>Accuracy Rate</p>
          </div>
          <div className="impact-stat">
            <h3>6</h3>
            <p>Waste Categories</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <span className="section-tag">Our Team</span>
        <h2>The Students Behind WasteVision</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-image">
              <img 
                src={sachzie}
                alt="Team member"
              />
            </div>
            <h3>Sachzie Sofia Ilagan</h3>
            <p className="team-role">Full Stack Developer</p>
          </div>
          
          <div className="team-card">
            <div className="team-image">
              <img 
                src={hazel}
                alt="Team member"
              />
            </div>
            <h3>Hazel Anne Elumba</h3>
            <p className="team-role">Frontend Developer</p>
          </div>
          
          <div className="team-card">
            <div className="team-image">
              <img 
                src={michael}
                alt="Team member"
              />
            </div>
            <h3>John Michael Danque</h3>
            <p className="team-role">Frontend Developer</p>
          </div>
          
          <div className="team-card">
            <div className="team-image">
              <img 
                src={drew}
                alt="Team member"
              />
            </div>
            <h3>Deannuel Drew Cortez</h3>
            <p className="team-role">Backend Developer</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <div className="about-cta-content">
          <h2>Try WasteVision Today!</h2>
          <p>Help us improve by testing our system—your feedback matters</p>
          <div className="about-cta-buttons">
            <Link to="/register" className="btn-primary">Get Started</Link>
            <Link to="/tips" className="btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;