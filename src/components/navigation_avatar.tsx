"use client";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  Spinner,
} from "flowbite-react";
import { redirect } from "next/navigation";

const fetchUser = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    const error = new Error();
    error.cause = response.status;
    throw error;
  }
  const data = await response.json();
  return data;
};
export default function NavigationAvatarItem() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <UserItem />
    </QueryClientProvider>
  );
}

export function UserItem() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: 1,
  });
  if (isPending) {
    return (
      <div className="ml-auto mr-8">
        <Spinner />
      </div>
    );
  }

  if (isError && error.cause == 401) {
    return (
      <div className="pl-4 pr-4 ml-auto mr-8 rounded-sm bg-teal-500 hover:bg-teal-600 text-black">
        <Button
          onClick={() => redirect(`${process.env.NEXT_PUBLIC_API_URL}/auth/openid-connect`)}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (isError) {
    return <p>Error</p>;
  }

  return (
    <div className="ml-auto mr-8">
      <Dropdown
        arrowIcon={false}
        inline={true}
        label={
          <label className="bg-border flex items-center justify-center w-12 h-12 rounded-full" />
        }
      >
        <DropdownItem>{data?.Username}</DropdownItem>
        <DropdownDivider />
        <DropdownItem
          onClick={() => {
            redirect(`${process.env.NEXT_PUBLIC_API_URL}/auth/openid-connect/logout`);
          }}
        >
          Logout
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
