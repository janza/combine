import KeyHandler, { KEYDOWN } from 'react-key-handler'
import React from 'react'
import Swipeable from 'react-swipeable'
import Head from 'next/head'
import game from '../lib/game'
import GameBoard from '../components/GameBoard'

class Page extends React.Component {
  constructor (props) {
    super()
    this.game = game()
    this.game.onUpdate(s => this.setState(s))
  }

  componentDidMount () {
    this.loadHighScore()
  }

  loadHighScore () {
    if (typeof window === 'undefined') return
    this.game.setHighScore(window.localStorage['score'] || 0)
  }

  isCloseToAngle (angle, target) {
    const tolerance = 0.6
    return target - tolerance < angle && angle < target + tolerance
  }

  swiped (e, deltaX, deltaY, isFlick, velocity) {
    if (!isFlick) return
    e.preventDefault()

    const angle = Math.atan2(deltaY, deltaX)
    console.log(angle)
    if (this.isCloseToAngle(angle, 0)) {
      this.game.moveDotsLeft()
    } else if (this.isCloseToAngle(angle, Math.PI)) {
      this.game.moveDotsRight()
    } else if (this.isCloseToAngle(angle, Math.PI / 2)) {
      this.game.rotateDots()
    } else if (this.isCloseToAngle(angle, -Math.PI / 2)) {
      this.game.pushDots()
    }
  }

  render () {
    return (
      <Swipeable onSwiped={this.swiped.bind(this)}>
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowDown'
          onKeyHandle={() => this.game.pushDots()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowLeft'
          onKeyHandle={() => this.game.moveDotsLeft()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowRight'
          onKeyHandle={() => this.game.moveDotsRight()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowUp'
          onKeyHandle={() => this.game.rotateDots()}
        />
        <Head>
          <title>Combine!</title>
          <meta charSet='utf-8' />
          <meta
            name='viewport'
            content='initial-scale=1.0, width=device-width'
          />
        </Head>

        <GameBoard
          width={500}
          colors={this.game.colors()}
          score={this.game.score()}
          highScore={this.game.highScore()}
          gameover={this.game.gameover()}
          level={this.game.level()}
          balls={this.game.balls()}
        />
      </Swipeable>
    )
  }
}

export default () => <Page />
