import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAGkPTpnMMI8BUu0EZ6O_6Ep2qRmSTWG-Y');

function App() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Eres experto en repuestos industriales MRO. 
Identifica este repuesto, busca el precio más bajo en USA (New/Open Box), aplica esta fórmula: 
Costo Base = precio más bajo + (peso en lb × 4)
Precio Final = Costo Base ÷ 0.65
Redondeo: ≤150 → 0.5 | 151-999 → decena superior | ≥1000 → centena superior
Devuelve SOLO en formato XML:
<TAB:Identificacion>datos técnicos</TAB>
<TAB:Imagen>https://url-imagen.jpg</TAB>
<TAB:Equivalentes>Marca1 SK123 | Marca2 ABC456</TAB>
<TAB:PrecioFinal>1234.50</TAB>
NO menciones fuentes ni cálculos. Consulta: ${text}`;

      const parts = [{ text: prompt }];
      if (image) {
        const base64 = await fileToBase64(image);
        parts.push({ inlineData: { data: base64, mimeType: image.type } });
      }

      const result = await model.generateContent(parts);
      const textResponse = await result.response.text();

      // Parse XML
      const ident = textResponse.match(/<TAB:Identificacion>([\s\S]*?)<\/TAB>/)?.[1] || '';
      const img = textResponse.match(/<TAB:Imagen>([\s\S]*?)<\/TAB>/)?.[1] || '';
      const equiv = textResponse.match(/<TAB:Equivalentes>([\s\S]*?)<\/TAB>/)?.[1] || '';
      const price = textResponse.match(/<TAB:PrecioFinal>([\s\S]*?)<\/TAB>/)?.[1] || '0';

      setResult({ ident, img, equiv: equiv.split('|'), price: parseFloat(price) });
    } catch (error) {
      alert('Error en IA: ' + error.message);
    }
    setLoading(false);
  };

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '28px' }}>MRO Selector PRO™</h1>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>by MRO RESOURCES</p>

      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ display: 'block', margin: '20px auto' }} />
      <input type="text" placeholder="O escribe la referencia..." value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: 'none', background: '#1e293b' }} />

      <button onClick={handleSearch} disabled={loading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(90deg, #0055ff, #00d1ff)', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold' }}>
        {loading ? 'Analizando con IA...' : 'Buscar y Cotizar Ahora'}
      </button>

      {result && (
        <div style={{ marginTop: '40px', background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h2>Datos Técnicos</h2>
          <p>{result.ident}</p>
          {result.img && <img src={result.img} alt="Repuesto" style={{ maxWidth: '100%', margin: '20px 0', borderRadius: '8px' }} />}
          <h2>Equivalentes</h2>
          <ul>{result.equiv.map((e, i) => <li key={i}>{e.trim()}</li>)}</ul>
          <h2 style={{ color: '#00ff9d', fontSize: '28px' }}>Precio Final: ${result.price.toFixed(2)} USD</h2>
          <p>Entrega estimada: 25 días</p>
          <button style={{ width: '100%', marginTop: '20px', padding: '14px', background: '#10b981', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Enviar Solicitud a Ventas
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
