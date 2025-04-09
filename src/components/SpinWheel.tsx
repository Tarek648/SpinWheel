import { useEffect, useMemo, useState } from 'react';
import { ISpinWheelProps } from './SpinWheel.interface';

const useSpinSound = () => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const spinSound = new Audio('/spin-wheel-sound.mp3');
      setAudio(spinSound);
    }
  }, []);
  return audio;
};

export const SpinWheel: React.FC<ISpinWheelProps> = ({
  segments,
  onFinished,
  primaryColor = 'black',
  contrastColor = 'white',
  buttonText = 'Spin',
  isOnlyOnce = true,
  size = 290,
  upDuration = 100,
  downDuration = 600,
  fontFamily = 'Arial',
  arrowLocation = 'center',
  showTextOnSpin = false,
  isSpinSound = true
}) => {
  const ticTicSound = useSpinSound();
  const [isFinished, setFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [needleText, setNeedleText] = useState('');
  const [targetSegmentIndex, setTargetSegmentIndex] = useState<number | null>(null);

  let currentSegment = '';
  let timerHandle: NodeJS.Timeout | null = null;
  const timerDelay = segments.length;
  let angleCurrent = 0;
  let angleDelta = 0;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let maxSpeed = Math.PI / segments.length;
  const upTime = segments.length * upDuration;
  const downTime = segments.length * downDuration;
  let spinStart = 0;
  let frames = 0;
  const centerX = size;
  const centerY = size;

  const segmentTextArray = segments.map(segment => segment.segmentText).filter(Boolean) as string[];
  const segColorArray = segments.map(segment => segment.segColor).filter(Boolean) as string[];

  useEffect(() => {
    wheelInit();
    return () => {
      if (timerHandle) clearInterval(timerHandle);
    };
  }, []);

  const wheelInit = () => {
    initCanvas();
    wheelDraw();
  };

  const initCanvas = () => {
    let canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('width', `${size * 2}`);
      canvas.setAttribute('height', `${size * 2}`);
      canvas.setAttribute('id', 'canvas');
      document.getElementById('wheel')?.appendChild(canvas);
    }
    canvasContext = canvas.getContext('2d');
    canvas.style.borderRadius = '50%';
    canvas.addEventListener('click', spin, false);
  };

  const spin = () => {
    if (isFinished && isOnlyOnce) return;
  
    setIsStarted(true);
    setFinished(false);
  
    // Weighted random selection logic
    const weights = segments.map(s => s.weight ?? 1);
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const rand = Math.random() * totalWeight;
  
    let accumulated = 0;
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      accumulated += weights[i];
      if (rand <= accumulated) {
        selectedIndex = i;
        break;
      }
    }
  
    setTargetSegmentIndex(selectedIndex);
  
    if (!timerHandle) {
      spinStart = Date.now();
      maxSpeed = Math.PI / segmentTextArray.length;
      frames = 0;
      timerHandle = setInterval(onTimerTick, timerDelay * 5);
    }
  };
  

  const onTimerTick = () => {
    frames++;
    wheelDraw();

    const duration = Date.now() - spinStart;
    let progress = 0;
    let finished = false;

    if (duration < upTime) {
      progress = duration / upTime;
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      progress = (duration - upTime) / downTime;
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
      if (progress >= 1) finished = true;
    }

    angleCurrent += angleDelta;
    while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2;

    if (finished) {
      setFinished(true);
      if (targetSegmentIndex !== null) {
        const finalAngle = (Math.PI * 2) * (segmentTextArray.length - targetSegmentIndex) / segmentTextArray.length;
        angleCurrent = finalAngle;
        currentSegment = segmentTextArray[targetSegmentIndex];
        setNeedleText(currentSegment);
        onFinished(currentSegment);
      }

      if (timerHandle) clearInterval(timerHandle);
      timerHandle = null;
      angleDelta = 0;

      if (ticTicSound) {
        ticTicSound.pause();
        ticTicSound.currentTime = 0;
      }
    }
  };

  useMemo(() => {
    if (!ticTicSound) return;
    ticTicSound.currentTime = 0;
    if (needleText && isSpinSound && isStarted) {
      ticTicSound.play().catch(e => console.error("Audio play failed:", e));
    } else {
      ticTicSound.pause();
      ticTicSound.currentTime = 0;
    }
  }, [needleText, isSpinSound, isStarted, ticTicSound]);

  const wheelDraw = () => {
    if (!canvasContext) return;
    clear();
    drawWheel();
    drawNeedle();
  };

  const clear = () => {
    if (!canvasContext) return;
    canvasContext.clearRect(0, 0, size * 2, size * 2);
  };

  const drawSegment = (key: number, lastAngle: number, angle: number) => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    const value = segmentTextArray[key];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColorArray[key];
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = contrastColor;
    ctx.font = `bold 1em ${fontFamily}`;
    ctx.fillText(value.substring(0, 21), size / 2 + 20, 0);
    ctx.restore();
  };

  const drawWheel = () => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    let lastAngle = angleCurrent;
    const len = segmentTextArray.length;
    const PI2 = Math.PI * 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = primaryColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `1em ${fontFamily}`;

    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent;
      drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.strokeStyle = contrastColor;
    ctx.fill();
    ctx.font = `bold 1em ${fontFamily}`;
    ctx.fillStyle = contrastColor;
    ctx.textAlign = 'center';
    ctx.fillText(buttonText, centerX, centerY + 3);
    ctx.stroke();

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
  };

  const drawNeedle = () => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    ctx.lineWidth = 1;
    ctx.strokeStyle = contrastColor;
    ctx.fillStyle = contrastColor;
    ctx.beginPath();

    if (arrowLocation === "top") {
      ctx.moveTo(centerX + 20, centerY / 15);
      ctx.lineTo(centerX - 20, centerY / 15);
      ctx.lineTo(centerX, centerY - (centerY / 1.35));
    } else {
      ctx.moveTo(centerX + 20, centerY - 30);
      ctx.lineTo(centerX - 20, centerY - 30);
      ctx.lineTo(centerX, centerY - (centerY / 2.5));
    }

    ctx.closePath();
    ctx.fill();

    const change = angleCurrent + Math.PI / 2;
    let i = segmentTextArray.length - Math.floor((change / (Math.PI * 2)) * segmentTextArray.length) - 1;

    if (i < 0) i += segmentTextArray.length;
    else if (i >= segmentTextArray.length) i -= segmentTextArray.length;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = primaryColor;
    ctx.font = `bold 1.5em ${fontFamily}`;

    currentSegment = segmentTextArray[i];
    setNeedleText(segmentTextArray[i]);
  };

  return (
    <div id='wheel' style={{ 
      textAlign: 'center', 
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        fontFamily: fontFamily, 
        color: primaryColor,
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '1px 1px 3px rgba(0,0,0,0.1)'
      }}>
        Spin to Win Amazing Prizes!
      </h2>
      
      <div style={{ 
        position: 'relative', 
        display: 'inline-block',
        margin: '20px 0'
      }}>
        <canvas
          id='canvas'
          width={size * 2}
          height={size * 2}
          style={{
            pointerEvents: isFinished && isOnlyOnce ? 'none' : 'auto',
            transition: 'transform 0.3s ease',
            cursor: 'pointer',
            opacity: isFinished && isOnlyOnce ? 0.8 : 1
          }}
        />
      </div>
      
      {showTextOnSpin && isStarted && (
        <div style={{
          textAlign: "center",
          padding: "20px",
          fontWeight: "bold",
          fontSize: "24px",
          fontFamily: fontFamily,
          color: primaryColor,
          margin: '20px 0',
          minHeight: '60px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          {needleText && `You won: ${needleText}!`}
        </div>
      )}
      
      <button 
        onClick={spin} 
        disabled={isFinished && isOnlyOnce}
        style={{
          padding: '15px 40px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: primaryColor,
          color: contrastColor,
          border: 'none',
          borderRadius: '50px',
          cursor: (isFinished && isOnlyOnce) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          opacity: (isFinished && isOnlyOnce) ? 0.6 : 1,
          margin: '20px 0'
        }}
        onMouseEnter={e => {
          if (!(isFinished && isOnlyOnce)) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        }}
      >
        {isFinished && isOnlyOnce ? 'Already Spun' : buttonText}
      </button>
      
      <div style={{ 
        marginTop: '30px',
        fontFamily: fontFamily,
        color: '#7f8c8d',
        fontSize: '14px',
        background: 'rgba(255,255,255,0.8)',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <p>Probability: iPhone (1%), $100 (10%), $50 (15%), Discount (30%), Free Spin (44%)</p>
      </div>
    </div>
  );
};
