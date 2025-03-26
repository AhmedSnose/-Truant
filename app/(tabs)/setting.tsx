import { StyleSheet, Text } from "react-native";

import MainContainer from "@/components/shared/MainContainer";

export default function HomeScreen() {

  return (
    <MainContainer>
      <Text>
        Setting
      </Text>
    </MainContainer>

  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
