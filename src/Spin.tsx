import React, { useState, useEffect, useCallback } from 'react';
import './Spin.css';

type Prize = {
  id: number;
  name: string;
  color: string;
  probability: number;
  textColor?: string;
};

const SpinningWheel: React.FC = () => {
  const prizes: Prize[] = [
    { id: 1, name: 'iPhone 16', color: '#FF6384', probability: 1, textColor: '#fff' },
    { id: 2, name: '$100 Gift Card', color: '#36A2EB', probability: 10, textColor: '#fff' },
    { id: 3, name: '$50 Gift Card', color: '#FFCE56', probability: 15, textColor: '#333' },
    { id: 4, name: '10% Discount', color: '#4BC0C0', probability: 30, textColor: '#fff' },
    { id: 5, name: 'Free Spin', color: '#9966FF', probability: 44, textColor: '#fff' },
  ];

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const getWeightedRandomPrize = useCallback(() => {
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    const normalizedPrizes = prizes.map(prize => ({
      ...prize,
      probability: (prize.probability / totalProbability) * 100
    }));

    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const prize of normalizedPrizes) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        return prize;
      }
    }

    return normalizedPrizes[normalizedPrizes.length - 1];
  }, []);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    setSpinCount(prev => prev + 1);
    
    const selectedPrize = getWeightedRandomPrize();
    setResult(selectedPrize);
    
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const segmentAngle = 360 / prizes.length;
    const extraRotations = (1*Math.random()*prizes.length); 
    const targetAngle = 360 * extraRotations + (segmentAngle - prizeIndex);
 
    setRotation(prev => prev + targetAngle); 
  };

  useEffect(() => {
    if (!isSpinning) return;

    const timer = setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
    }, 3000); // Reduced from 5000 to 3000ms for faster spin

    return () => clearTimeout(timer);
  }, [isSpinning]);

  return (
    <div className="spinning-wheel-container">
      <h1 className="wheel-title">Spin to Win!</h1>
      <p className="spin-counter">Spins: {spinCount}</p>
      
      <div className="wheel-container">
        <div 
          className={`wheel ${isSpinning ? 'spinning' : ''}`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {prizes.map((prize, index) => {
            const segmentAngle = 360 / prizes.length;
            const rotateAngle = segmentAngle * index;
            const skewAngle = 90 - segmentAngle;
            
            return (
              <div 
                key={prize.id}
                className="wheel-segment"
                style={{
                  transform: `rotate(${rotateAngle}deg) skewY(${skewAngle}deg)`,
                  backgroundColor: prize.color
                }}
              >
                <span 
                  className="segment-text"
                  style={{ 
                    transform: `skewY(-${skewAngle}deg) rotate(${segmentAngle / 2}deg)`,
                    color: prize.textColor || '#fff'
                  }}
                >
                  {prize.name}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="wheel-center">
          <div className="wheel-center-inner"></div>
        </div>
        <div className="wheel-pointer"></div>
      </div>
      
      <button 
        onClick={spinWheel} 
        disabled={isSpinning}
        className={`spin-button ${isSpinning ? 'disabled' : ''}`}
      >
        {isSpinning ? (
          <span className="spinner"></span>
        ) : (
          'SPIN NOW!'
        )}
      </button>
      
      {showResult && result && (
        <div className="result-modal">
          <div className="result-content" style={{ borderTop: `5px solid ${result.color}` }}>
            <h2>🎉 Congratulations! 🎉</h2>
            <p className="result-prize">You won: <strong>Ba3bus 🖕🏽 Hmar ana la 23tik prize </strong>
                 {/* <strong style={{ color: result.color }}>{result.name}</strong> */}
                 </p>
            <button 
              onClick={() => setShowResult(false)}
              className="close-button"
            >
              Claim Prize
            </button>
          </div>
        </div>
      )}
      
      {/* <div className="probability-info">
        <h3>Prize Probabilities:</h3>
        <div className="probability-grid">
          {prizes.map(prize => (
            <div 
              key={prize.id} 
              className="probability-item"
              style={{ 
                backgroundColor: prize.color,
                color: prize.textColor || '#fff',
                width: `${prize.probability}%`
              }}
            >
              <span>{prize.name}</span>
              <span>{prize.probability}%</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default SpinningWheel;