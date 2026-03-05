import { Composition } from "remotion";
import { LogoAnimation } from "./LogoAnimation";

export const Root: React.FC = () => {
    return (
        <>
            <Composition
                id="LogoAnimation"
                component={LogoAnimation}
                durationInFrames={180}
                fps={60}
                width={1080}
                height={1080}
            />
        </>
    );
};
