// Utils
import { lazy } from 'react';
const HomePage = lazy(() => import("@userpage-pages/HomePage"));

const MainPage = () => {

  return (
    <HomePage/>
  )
}

export default MainPage