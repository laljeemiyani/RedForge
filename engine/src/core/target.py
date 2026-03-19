import httpx
import json


class TargetAI:
    def __init__(
        self,
        url,
        auth_headers,
        mode="auto",
        request_template=None,
        response_path=None,
        model=None,
    ):
        self.url = url
        self.auth_headers = auth_headers
        self.mode = mode
        self.request_template = request_template
        self.response_path = response_path
        self.model = model

        if self.mode == "auto":
            if any(
                x in (self.url or "")
                for x in [
                    "openai.com",
                    "openrouter.ai",
                    "groq.com",
                    "aimlapi.com",
                    "anthropic.com",
                    "googleapis.com",
                ]
            ):
                self.mode = "openai"
            else:
                self.mode = "simple"

    def _extract_by_path(self, data, path) -> str:
        try:
            parts = path.split(".")
            current = data
            for part in parts:
                if part.isdigit():
                    current = current[int(part)]
                else:
                    current = current[part]
            return str(current)
        except Exception:
            return "NO_RESPONSE"

    async def send_message(self, message: str) -> str:
        try:
            headers = {"Content-Type": "application/json"}
            if self.auth_headers:
                headers.update(self.auth_headers)

            timeout = 30.0
            async with httpx.AsyncClient(timeout=timeout) as client:
                if self.request_template:
                    body_str = self.request_template.replace("{{message}}", message)
                    body = json.loads(body_str)
                    response = await client.post(self.url, json=body, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                elif self.mode == "openai":
                    response = await client.post(
                        self.url,
                        json={
                            "model": self.model or "openrouter/auto",
                            "messages": [{"role": "user", "content": message}],
                        },
                        headers=headers,
                    )
                    response.raise_for_status()
                    data = response.json()
                else:
                    # default: "simple"
                    response = await client.post(
                        self.url,
                        json={"message": message},
                        headers=headers,
                    )
                    response.raise_for_status()
                    data = response.json()

                if self.response_path:
                    return self._extract_by_path(data, self.response_path)
                elif self.mode == "openai":
                    return data["choices"][0]["message"]["content"]
                else:
                    return data.get("response") or data.get("message") or str(data)
        except Exception as e:
            print(f"ERROR CALLING TARGET: {type(e).__name__}: {e}")
            print(f"URL: {self.url}")
            print(f"MODE: {self.mode}")
            return "NO_RESPONSE"
