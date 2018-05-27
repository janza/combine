import KeyHandler, { KEYDOWN } from 'react-key-handler'
import Swipeable from 'react-swipeable'

function isCloseToAngle (target) {
  return angle => {
    const tolerance = 0.6
    return target - tolerance < angle && angle < target + tolerance
  }
}

const isLeftSwipe = isCloseToAngle(0)
const isRightSwipe = isCloseToAngle(Math.PI)
const isUpSwipe = isCloseToAngle(Math.PI / 2)
const isDownSwipe = isCloseToAngle(-Math.PI / 2)

export default ({ children, left, right, up, down }) => {
  return (
    <Swipeable onSwiped={(e, deltaX, deltaY, isFlick, velocity) => {
      if (!isFlick) return
      e.preventDefault()

      const angle = Math.atan2(deltaY, deltaX)

      if (isLeftSwipe(angle)) {
        left()
      } else if (isRightSwipe(angle)) {
        right()
      } else if (isUpSwipe(angle)) {
        up()
      } else if (isDownSwipe(angle)) {
        down()
      }
    }}>
      <KeyHandler
        keyEventName={KEYDOWN}
        keyValue='ArrowDown'
        onKeyHandle={down}
      />
      <KeyHandler
        keyEventName={KEYDOWN}
        keyValue='ArrowLeft'
        onKeyHandle={left}
      />
      <KeyHandler
        keyEventName={KEYDOWN}
        keyValue='ArrowRight'
        onKeyHandle={right}
      />
      <KeyHandler
        keyEventName={KEYDOWN}
        keyValue='ArrowUp'
        onKeyHandle={up}
      />
      {children}
    </Swipeable>
  )
}
