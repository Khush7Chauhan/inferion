"use client";

import { useEffect } from "react";
import { client } from "../lib/rpc-client";

export function UserQuery() {
  useEffect(() => {
    client.user.get({ id: "123" }).then(user => {
      console.log(user);
    });
  }, []);

  return null;
}
