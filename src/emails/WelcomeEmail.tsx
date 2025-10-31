import {
  Button,
  Container,
  Heading,
  Link,
  Tailwind,
  Text,
} from "@react-email/components";
import type { UserModel } from "../modules/user/UserModel";

export default function WelcomeEmail({
  firstName,
  lastName,
}: Pick<UserModel.UserInfo, "firstName" | "lastName">) {
  const verificationUrl = "https://planned-service.com/confirm-email";

  return (
    <Tailwind>
      <Container className="max-w-md mx-auto p-6  border border-gray-200 rounded-md font-sans">
        <Heading className="text-center text-2xl font-bold">
          Welcome aboard
        </Heading>
        <Heading className="text-center text-gray-800 text-xl font-semibold">
          {firstName} {lastName}
        </Heading>
        <Text className="text-center">
          <br />
          confirm your email to unlock all features and stay updated with the
          latest news.
        </Text>

        <div className="text-center mb-4">
          <Button
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md"
            href={verificationUrl}
          >
            Verify
          </Button>
        </div>

        <Link
          className="text-center text-sm text-gray-500"
          href={verificationUrl}
        >
          {verificationUrl}
        </Link>
      </Container>
    </Tailwind>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: "Suleyman",
  lastName: "Laarabi",
};
