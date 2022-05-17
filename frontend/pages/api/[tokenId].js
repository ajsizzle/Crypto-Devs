export default function handler(req, res) {
  // get tokenId from the query params
  const tokenId = req.query.tokenId;
  // extract images from github directly.
  const image_url =
    "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

  res.status(200).json({
    name: "Crypto Dev #" + tokenId,
    description: "Crypto Dev is a collection of Web 3.0 Developers",
    image: image_url + tokenId + ".svg",
  });
}
