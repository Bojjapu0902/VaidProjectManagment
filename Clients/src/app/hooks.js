import { useDispatch, useSelector } from "react-redux";

// Thin re-exports so feature code imports from one place and we can
// add TypeScript types here later without touching call sites.
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
