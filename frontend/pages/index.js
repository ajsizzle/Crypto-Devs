import { useEffect, useRef, useState } from "react"
import Head from "next/head"
import { providers, Contract, utils } from "ethers"
import Web3Modal from "web3modal"
import styles from "../styles/Home.module.css"
import { abi, NFT_CONTRACT_ADDRESS } from "../constants"

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false)
  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0")
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false)
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false)
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false)
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false)
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef()

  /**
   * @dev connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner()
      setWalletConnected(true)
      setLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * presaleMint: Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const txn = await whitelistContract.presaleMint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        value: utils.parseEther("0.01"),
      })
      setLoading(true)
      await txn.wait()
      window.alert(
        "You've successfully minted a CryptoDev! Congratulations! 🥳"
      )
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {
    try {
      // We need a Signer here to write transaction
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, which allows update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // call the mint from the contract to mint the Crypto Dev NFT
      const txn = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      })
      setLoading(true)
      await txn.wait()
      window.alert(
        "You've successfully minted a CryptoDev! Congratulations! 🥳"
      )
      setLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @dev getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner(true)
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // call the owner function from the contract
      const _owner = await nftContract.owner()
      // Get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true)
      // Get the address associated to the signer which is connected to MetaMask
      const address = await signer.getAddress()
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @dev startPresale: starts the presale for the NFT Collection
   */
  const startPresale = async () => {
    try {
      // Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true)
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // call the startPresale from the contract
      const txn = await whitelistContract.startPresale()
      setLoading(true)
      await txn.wait()
      // set the presale started to true
      await checkIfPresaleStarted(true)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @dev checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
   * variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal (read-only)
      const provider = await getProviderOrSigner()
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted()
      if (!_presaleStarted) {
        await getOwner()
      }
      setPresaleStarted(_presaleStarted)
      return _presaleStarted
    } catch (error) {
      console.error(error)
      return false
    }
  }

  /**
   * @dev checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
   * variable in the contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal (read-only)
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded()
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000))
      if (hasEnded) {
        setPresaleEnded(true)
      } else {
        setPresaleEnded(false)
      }
      return hasEnded
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * @dev getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // Get provider from web3Modal (read-only)
      const provider = await getProviderOrSigner()
      // Connect to the Contract with the provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds()
      // _tokenIds is a `Big Number`. Convert to string
      setTokenIdsMinted(_tokenIds.toString())
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // we need to gain access to the provider/signer from metamask
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    // if user is NOT connected to Rinkeby, tell them to switch to Rinkeby
    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network")
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }

    return web3Provider
  }

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      })

      connectWallet()

      // Check if presale has strated and ended
      const _presaleStarted = checkIfPresaleStarted()
      if (_presaleStarted) {
        checkIfPresaleEnded()
      }

      getTokenIdsMinted()

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted()
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded()
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval)
          }
        }
      }, 5 * 1000)

      // set interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted()
      }, 5 * 1000)
    }
  }, [walletConnected])

  /**
   * @dev renderButton: Returns a button based on the state of the Dapp
   */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      )
    }

    // If we are currently waiting for something, return loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      )
    }

    // If connected user is not the owner but presale hasn't started yet, come back later
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>
            Presale hasn't started yet. Come back later!
          </div>
        </div>
      )
    }

    // If presale started, but hasn't ended yet, allow users to mint who are whitelisted
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale is live! If your address is whitelisted, you can mint a
            CryptoDev 🤩
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      )
    }

    // If presale started and has ended, allow users to take part in public sale
    if (presaleStarted && presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has ended. Public mint is live!
          </div>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            It's an NFT collection for Web 3.0 Developers.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/30 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Alex Johnson
      </footer>
    </div>
  )
}
