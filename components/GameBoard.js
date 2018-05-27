import { CSSTransition, TransitionGroup } from 'react-transition-group'
import Ball from '../components/Ball'
import Levels from '../components/Levels'

const Score = ({ score, highScore }) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: 'Open sans, sans-serif',
      color: '#aaa',
      fontWeight: 'bold',
      right: '105%',
      top: '5%',
      whiteSpace: 'nowrap'
    }}
  >
    <div>SCORE: {score}</div>
    <div>HIGHSCORE: {highScore}</div>
  </div>
)

const GameOverScreen = ({ gameover }) => (
  <div
    style={{
      display: gameover ? 'block' : 'none',
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '50px',
      fontFamily: 'Open sans, sans-serif',
      whiteSpace: 'nowrap',
      color: '#d50000',
      fontWeight: 'bold'
    }}
  >
    GAME OVER
  </div>
)

const GameBox = ({ width, children }) => {
  console.log(arguments)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        background: '#f5f5f5',
        margin: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }}
    >
      <div
        style={{
          position: 'relative',
          border: '1px solid #ddd',
          width: `${width}px`,
          maxWidth: '100%',
          background: '#fff'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '100%',
            height: 0
          }}
        />
        {children}
      </div>
    </div>
  )
}

export default ({
  width,
  colors,
  score,
  highScore,
  gameover,
  level,
  balls
}) => (
  <GameBox width={width}>
    <Score score={score} highScore={highScore} />
    <GameOverScreen gameover={gameover} />
    <Levels colors={colors} current={level} />

    <style jsx global>{`
      .ball-enter {
        transform: scale(1.7);
        border-radius: 0% !important;
        opacity: 0.01;
        z-index: 2;
      }

      .ball-enter.ball-enter-active {
        opacity: 1;
        transform: scale(1);
        border-radius: 50% !important;
        transition: 0.3s !important;
        z-index: 2;
      }

      .ball-exit {
        opacity: 1;
      }

      .ball-exit.ball-exit-active {
        opacity: 0.01;
        border-radius: 0% !important;
        transform: scale(0.7);
        transition: 0.4s !important;
      }
    `}</style>
    <TransitionGroup>
      {balls.map(params => (
        <CSSTransition
          key={params.key}
          classNames='ball'
          timeout={{ enter: 300, exit: 400 }}
        >
          <Ball colors={colors} {...params} />
        </CSSTransition>
      ))}
    </TransitionGroup>
  </GameBox>
)
