import { useLocation } from 'wouter';

export default function Gallery() {
  const [, setLocation] = useLocation();
  const sampleGalleryItems = [
    {
      id: "1",
      title: "Glamorous Evening Look",
      description: "Professional makeup for special occasions",
      category: "Makeup",
      providerName: "Beauty By Sarah",
      price: 85
    },
    {
      id: "2", 
      title: "Modern Hair Styling",
      description: "Contemporary cut and styling",
      category: "Hair",
      providerName: "Elite Hair Studio",
      price: 120
    },
    {
      id: "3",
      title: "Bridal Makeup",
      description: "Perfect look for your special day",
      category: "Bridal",
      providerName: "Radiant Beauty",
      price: 150
    },
    {
      id: "4",
      title: "Color & Style",
      description: "Hair color transformation with styling",
      category: "Hair Color",
      providerName: "ColorCraft Salon",
      price: 200
    },
    {
      id: "5",
      title: "Natural Glow Makeup",
      description: "Everyday natural makeup look",
      category: "Makeup",
      providerName: "Fresh Face Studio",
      price: 65
    },
    {
      id: "6",
      title: "Creative Hair Design",
      description: "Artistic hair styling and design",
      category: "Creative",
      providerName: "Artistic Hair Co",
      price: 180
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #f3e8ff 100%)',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <button 
          onClick={() => setLocation('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '2rem'
          }}
        >
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Beauty Gallery
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Discover stunning transformations and inspiring beauty work from our talented professionals
          </p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#8b5cf6',
            border: '2px dashed #8b5cf6',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            ➕ Add Photos (Coming Soon)
          </button>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Beauty professionals will be able to showcase their work here
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {sampleGalleryItems.map((item) => (
            <div key={item.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #e0e7ff 0%, #fce7f3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {item.category === 'Makeup' ? '💄' : 
                   item.category === 'Hair' || item.category === 'Hair Color' ? '💇‍♀️' :
                   item.category === 'Bridal' ? '👰' : '✨'}
                </div>
                <p style={{ color: '#8b5cf6', fontWeight: '600' }}>{item.category} Work</p>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {item.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>
                    {item.providerName}
                  </span>
                  <span style={{ fontWeight: '700', color: '#1f2937' }}>
                    ${item.price}
                  </span>
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#f3e8ff', 
          borderRadius: '12px'
        }}>
          <p style={{ color: '#7c3aed', fontWeight: '600', marginBottom: '0.5rem' }}>
            This gallery showcases the quality of work from our beauty professionals.
          </p>
          <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
            Providers will be able to upload their own portfolio images in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}