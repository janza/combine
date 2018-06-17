import React from 'react'
import Head from 'next/head'
import game from '../lib/game'
import GameBoard from '../components/GameBoard'
import GameControls from '../components/GameControls'

export default class Page extends React.Component {
  constructor () {
    super()
    this.game = game()
    this.game.onUpdate(s => this.setState(s))
  }

  componentDidMount () {
    if (typeof window === 'undefined') return
    this.game.setHighScore(window.localStorage['score'] || 0)
  }

  render () {
    return (
      <GameControls
        up={this.game.rotateDots}
        down={this.game.pushDots}
        left={this.game.moveDotsLeft}
        right={this.game.moveDotsRight}
      >
        <Head>
          <title>Combine!</title>
          <meta charSet='utf-8' />
          <meta
            name='viewport'
            content='initial-scale=1.0, width=device-width'
          />
        </Head>

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
          <GameBoard
            width={600}
            colors={this.game.colors()}
            score={this.game.score()}
            highScore={this.game.highScore()}
            gameover={this.game.gameover()}
            level={this.game.level()}
            balls={this.game.balls()}
          />
        </div>
      </GameControls>
    )
  }
}
