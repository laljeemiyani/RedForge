import httpx


class TargetAI:
    def __init__(self, url, auth_headers, mode="auto"):
        self.url = url
        self.auth_headers = auth_headers
        self.mode = mode

        if self.mode == "auto":
            if ("openai.com" in (self.url or "")) or (
                "openrouter.ai" in (self.url or "")
            ):
                self.mode = "openai"
            else:
                self.mode = "simple"

    async def send_message(self, message: str) -> str:
        try:
            headers = {"Content-Type": "application/json"}
            if self.auth_headers:
                headers.update(self.auth_headers)

            timeout = 30.0
            async with httpx.AsyncClient(timeout=timeout) as client:
                if self.mode == "openai":
                    response = await client.post(
                        self.url,
                        json={
                            "model": "openrouter/auto",
                            "messages": [{"role": "user", "content": message}],
                        },
                        headers=headers,
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]

                # default: "simple"
                response = await client.post(
                    self.url,
                    json={"message": message},
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response") or data.get("message") or str(data)
        except Exception as e:
            print(f"ERROR CALLING TARGET: {type(e).__name__}: {e}")
            print(f"URL: {self.url}")
            print(f"MODE: {self.mode}")
            return "NO_RESPONSE"
