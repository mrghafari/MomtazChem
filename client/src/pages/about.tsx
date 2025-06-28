import { Award, Leaf, Users, Globe, Target, Eye } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const About = () => {
  const { t, direction } = useLanguage();
  
  const values = [
    {
      icon: <Award className="h-8 w-8 text-white" />,
      title: t.qualityExcellence,
      description: t.qualityExcellenceDesc,
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: t.environmentalResponsibility,
      description: t.environmentalResponsibilityDesc,
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: t.customerFocus,
      description: t.customerFocusDesc,
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: t.globalReach,
      description: t.globalReachDesc,
    },
  ];

  return (
    <div className={`pt-20 ${direction === 'rtl' ? 'rtl' : 'ltr'}`} dir={direction}>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.aboutTitle}</h1>
            <p className="text-xl max-w-3xl mx-auto">
              {t.aboutSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.ourStory}</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t.storyParagraph1}
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t.storyParagraph2}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.storyParagraph3}
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Modern chemical manufacturing facility"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className={`flex items-center mb-6 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center ${direction === 'rtl' ? 'ml-4' : 'mr-4'}`}>
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.ourMission}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t.missionText}
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className={`flex items-center mb-6 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 bg-primary-green rounded-lg flex items-center justify-center ${direction === 'rtl' ? 'ml-4' : 'mr-4'}`}>
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.ourVision}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t.visionText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.ourCoreValues}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.valuesSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${
                  index % 2 === 0 ? 'bg-primary-blue' : 'bg-primary-green'
                } rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team & Facilities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.ourTeamExpertise}</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t.teamText}
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold primary-blue mb-2">500+</div>
                  <div className="text-gray-600">{t.employees}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold primary-green mb-2">50+</div>
                  <div className="text-gray-600">{t.rdScientists}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold accent-orange mb-2">15+</div>
                  <div className="text-gray-600">{t.manufacturingSites}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold primary-blue mb-2">99.8%</div>
                  <div className="text-gray-600">{t.qualityRate}</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Chemical research laboratory"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.certificationsCompliance}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.certificationsSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-certificate text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">ISO 9001:2015</h3>
              <p className="text-gray-600 text-sm">Quality Management Systems</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-shield-alt text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">ISO 14001</h3>
              <p className="text-gray-600 text-sm">Environmental Management</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-hard-hat text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">OHSAS 18001</h3>
              <p className="text-gray-600 text-sm">Occupational Health & Safety</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-check-circle text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">REACH Compliance</h3>
              <p className="text-gray-600 text-sm">European Chemicals Regulation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
