import KeyHandler, { KEYDOWN } from 'react-key-handler'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import React from 'react'
import Swipeable from 'react-swipeable'
import Head from 'next/head'

const width = 500

const colors = [
  '#4CDC00',
  '#FDD401',
  '#DB7D1B',
  '#DD2C2C',
  '#EE519F',
  '#AC32AF',
  '#314FFF',
  '#0EC5EC',
  '#131313',
  '#E9E9E9'
]

const thresholds = [0, 0, 5, 30, 90, 150, 230, 280, 350, 450]

var dotsId = 0

const Dot = ({ x, y, type, floating }) => (
  <div
    style={{
      position: 'absolute',
      transition: !floating ? 'top 0.4s, left 0.06s linear' : '0.1s',
      left: `${100 / 7 * x}%`,
      top: `${100 / 7 * y}%`,
      background: colors[type],
      borderRadius: '50%',
      width: `${100 / 7}%`,
      height: `${100 / 7}%`
    }}
  />
)

const Levels = ({ current }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: '100%',
        width: '100%',
        height: `${100}%`,
        display: 'flex',
        flexDirection: 'row-reverse'
      }}
    >
      {colors.map((c, i) => {
        return (
          <div
            key={c}
            style={{
              background: c,
              opacity: current >= i ? 1 : 0.2,
              width: `${100 / colors.length}%`,
              height: `${100 / colors.length}%`
            }}
          />
        )
      })}
    </div>
  )
}

class Page extends React.Component {
  constructor (props) {
    super()
    this.state = {
      dots: [],
      score: 0,
      highScore: 0,
      floatingDots: [this.newDot(4, 1), this.newDot(5, 0)],
      level: 2,
      blocksKilled: 0
    }
  }
  componentDidMount () {
    this.loadHighScore()
  }
  newDot (x, level) {
    return this.newDotAt(x, -1, level)
  }
  newDotAt (x, y, level) {
    return {
      x,
      y,
      key: dotsId++,
      type:
        level !== undefined
          ? level
          : Math.floor(Math.random() * this.state.level)
    }
  }
  moveDotsLeft () {
    if (
      this.state.floatingDots.reduce((min, d) => Math.min(d.x, min), 7) === 0
    ) {
      return
    }
    this.setState({
      ...this.state,
      floatingDots: this.state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x - 1
        }
      })
    })
  }

  settleDots (dots) {
    const newMap = {}
    for (let i = 0; i < 7; i++) {
      newMap[i] = {}
      for (let j = -1; j < 7; j++) {
        newMap[i][j] = null
      }
    }
    dots.forEach(d => {
      newMap[d.x][d.y] = d
    })
    for (let i = 0; i < 7; i++) {
      var firstFree = null
      for (let j = 6; j >= -1; j--) {
        if (!newMap[i][j] && firstFree === null) {
          firstFree = j
        }
        if (newMap[i][j] && firstFree !== null) {
          newMap[i][j].y = firstFree--
        }
      }
    }
    return [...dots]
  }

  cleanupDots (dots, cb) {
    const map = {}
    const keep = {}
    for (let i = 0; i < 7; i++) {
      map[i] = {}
      keep[i] = {}
      for (let j = -1; j < 7; j++) {
        map[i][j] = null
        keep[i][j] = true
      }
    }
    dots.forEach(d => {
      map[d.x][d.y] = d
    })
    const checkTile = d => {
      if (!d) return []
      map[d.x][d.y] = null
      return [
        map[d.x >= 6 ? 6 : d.x + 1][d.y],
        map[d.x <= 0 ? 0 : d.x - 1][d.y],
        map[d.x][d.y >= 6 ? 6 : d.y + 1],
        map[d.x][d.y <= 0 ? 0 : d.y - 1]
      ]
        .filter(n => n && n.type === d.type)
        .reduce((l, d) => l.concat(checkTile(d)), [])
        .concat([d])
    }
    let freshDots = []
    for (let i = 0; i < 7; i++) {
      for (let j = -1; j < 7; j++) {
        const l = checkTile(map[i][j])
        if (l.length > 2) {
          const newColoredDot = l.reduce(
            (min, d) => {
              if (d.y > min.y) return d
              if (d.y === min.y && d.x < min.x) return d
              return min
            },
            { x: 10, y: -2 }
          )

          if (newColoredDot.type < colors.length - 1) {
            freshDots.push(
              this.newDotAt(
                newColoredDot.x,
                newColoredDot.y,
                newColoredDot.type + 1
              )
            )
          }
          l.forEach((d, i) => {
            keep[d.x][d.y] = false
            this.updateScore(this.state.score + (newColoredDot.type + 1) * 5)
          })
          this.state.blocksKilled++
        }
      }
    }

    const newDots = dots.filter(d => keep[d.x][d.y]).concat(freshDots)
    return newDots
  }
  findAt (x, y) {
    return this.state.dots.filter(d => d.x === x && d.y === y)[0] || {}
  }
  moveDotsRight () {
    if (
      this.state.floatingDots.reduce((max, d) => Math.max(d.x, max), 0) === 6
    ) {
      return
    }
    this.setState({
      ...this.state,
      floatingDots: this.state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x + 1
        }
      })
    })
  }
  gameOver () {
    this.setState({
      gameover: true,
      dots: [],
      floatingDots: []
    })
    this.updateScore(this.state.score)
  }

  updateScore (score) {
    if (typeof window === 'undefined') return
    const highScore = Math.max(score, this.state.highScore)
    window.localStorage['score'] = highScore
    this.setState({ highScore, score })
  }

  loadHighScore () {
    if (typeof window === 'undefined') return
    return this.setState({ highScore: window.localStorage['score'] || 0 })
  }

  pushDots () {
    const floatingDots = this.state.floatingDots
    if (!floatingDots.length) return
    const inactiveDots = this.state.dots
    const newDots = floatingDots.map(d => {
      const dotsInSameCol = inactiveDots
        .filter(id => id.x === d.x)
        .map(d => d.y)
      if (dotsInSameCol.length) {
        return {
          ...d,
          y: Math.min(...dotsInSameCol) + d.y
        }
      } else {
        return {
          ...d,
          y: 7 + d.y
        }
      }
    })
    this.setState({
      ...this.state,
      dots: inactiveDots.concat(newDots),
      floatingDots: []
    })
    setTimeout(() => this.cleanupBoard([], this.state.dots), 300)
  }

  cleanupBoard (oldRun, newRun) {
    oldRun = newRun
    newRun = this.cleanupDots(oldRun)
    const level = thresholds.findIndex(l => l > this.state.blocksKilled)
    this.setState({
      ...this.state,
      level: level < 0 ? colors.length - 1 : level,
      dots: newRun
    })
    if (oldRun.length === newRun.length) {
      if (newRun.some(d => d.y < 0)) return this.gameOver()
      return this.setState({
        ...this.state,
        floatingDots: [this.newDot(4), this.newDot(5)]
      })
    }
    setTimeout(() => {
      newRun = this.settleDots(newRun)
      this.setState({
        ...this.state,
        dots: newRun
      })
      setTimeout(() => this.cleanupBoard(oldRun, newRun), 300)
    }, 300)
  }

  rotateDots () {
    const dots = this.state.floatingDots
    if (!dots.length) return
    var newFloatingDots
    if (dots[0].y === dots[1].y) {
      if (dots[0].x < dots[1].x) {
        newFloatingDots = [
          {
            ...dots[0],
            y: dots[1].y - 1,
            x: dots[1].x
          },
          dots[1]
        ]
      } else {
        newFloatingDots = [
          dots[0],
          {
            ...dots[1],
            y: dots[0].y - 1,
            x: dots[0].x
          }
        ]
      }
    } else {
      if (dots[0].y < dots[1].y) {
        newFloatingDots = [
          {
            ...dots[0],
            x: dots[1].x,
            y: dots[1].y
          },
          {
            ...dots[1],
            x: dots[1].x - 1,
            y: dots[1].y
          }
        ]
      } else {
        newFloatingDots = [
          {
            ...dots[0],
            x: dots[0].x - 1,
            y: dots[0].y
          },
          {
            ...dots[1],
            x: dots[0].x,
            y: dots[0].y
          }
        ]
      }
    }
    if (newFloatingDots[0].x < 0 || newFloatingDots[1].x < 0) {
      newFloatingDots = newFloatingDots.map(d => ({
        ...d,
        x: d.x + 1
      }))
    }
    this.setState({
      ...this.state,
      floatingDots: newFloatingDots
    })
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
      this.moveDotsLeft()
    } else if (this.isCloseToAngle(angle, Math.PI)) {
      this.moveDotsRight()
    } else if (this.isCloseToAngle(angle, Math.PI / 2)) {
      this.rotateDots()
    } else if (this.isCloseToAngle(angle, -Math.PI / 2)) {
      this.pushDots()
    }
  }
  render () {
    return (
      <Swipeable onSwiped={this.swiped.bind(this)}>
        <Head>
          <title>Combine!</title>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
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
          <style jsx global>{`
            .example-enter {
              transform: scale(1.7);
              border-radius: 0% !important;
              opacity: 0.01;
              z-index: 2;
            }

            .example-enter.example-enter-active {
              opacity: 1;
              transform: scale(1);
              border-radius: 50% !important;
              transition: 0.3s !important;
              z-index: 2;
            }

            .example-exit {
              opacity: 1;
            }

            .example-exit.example-exit-active {
              opacity: 0.01;
              border-radius: 0% !important;
              transform: scale(0.7);
              transition: 0.4s !important;
            }
          `}</style>

          <KeyHandler
            keyEventName={KEYDOWN}
            keyValue="ArrowDown"
            onKeyHandle={() => this.pushDots()}
          />
          <KeyHandler
            keyEventName={KEYDOWN}
            keyValue="ArrowLeft"
            onKeyHandle={() => this.moveDotsLeft()}
          />
          <KeyHandler
            keyEventName={KEYDOWN}
            keyValue="ArrowRight"
            onKeyHandle={() => this.moveDotsRight()}
          />
          <KeyHandler
            keyEventName={KEYDOWN}
            keyValue="ArrowUp"
            onKeyHandle={() => this.rotateDots()}
          />

          <div
            style={{
              position: 'relative',
              border: '1px solid #ddd',
              width: `${width}px`,
              // paddingBottom: '100%',
              // height: 0,
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
              <div>SCORE: {this.state.score}</div>
              <div>HIGHSCORE: {this.state.highScore}</div>
            </div>
            <div
              style={{
                display: this.state.gameover ? 'block' : 'none',
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
            <Levels current={this.state.level} />
            <TransitionGroup>
              {this.state.dots
                .concat(
                  this.state.floatingDots.map(i => ({ ...i, floating: true }))
                )
                .map((params, i) => {
                  return (
                    <CSSTransition
                      key={params.key}
                      classNames="example"
                      timeout={{ enter: 300, exit: 400 }}
                    >
                      <Dot {...params} />
                    </CSSTransition>
                  )
                })}
            </TransitionGroup>
          </div>
        </div>
      </Swipeable>
    )
  }
}

export default () => <Page />
