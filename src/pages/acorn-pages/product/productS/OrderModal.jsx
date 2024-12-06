import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState,useEffect } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
export default function OrderModal({handleClose}){
    const [error,setError]=useState(null);
    const [isLoading,setIsLoading]=useState(false);
    const [blist,setBlist]=useState(null);  //대분류 상품 목록
    const [list,setList]=useState([]);  //대분류 별 소분류 상품 목록
    const [showList,setShowList]=useState(false);   //소분류 목록 보이기
    const [showCartList,setShowCartList]=useState(false);   //발주 목록 보이기
    const [cart,setCart]=useState([]);  //발주 목록(장바구니)
    const [alertVisible, setAlertVisible] = useState(false); // Alert 상태 추가
    const [alertMessage, setAlertMessage] = useState(""); // Alert 메시지 상태
    const [ordersEndDate, setOrdersEndDate] = useState(""); //발주 마감일
    const [minDate, setMinDate] = useState(""); //발주 등록 가능일 
    const [total,setTotal] = useState(0);
    const getProductBCode=function(){
        axios.get('http://localhost:8080/productB')
            .then(res=>{
                setBlist(res.data);
                setIsLoading(true);
            })
            .catch((err)=>{
                setIsLoading(true);
                setError(err);
            })
    };
    const showProducList=async function(e){
        let productBCode=e.target.value;
        await axios.get(`http://localhost:8080/product/order/${productBCode}`)
            .then(res=>{
                setList(res.data);
                setIsLoading(true);
                setShowList(true);
            })
            .catch((err)=>{
                setIsLoading(true);
                setError(err);
            })
    };
    const showCart=(e)=>{
        const selectedProduct = JSON.parse(e.target.value);

        const existingProduct = cart.find(product=>
            product.productDtoFO.productCode===selectedProduct.productCode
        );
        if(!existingProduct){
            setCart(prevCart=>[
                ...prevCart,
                {
                    ordersEa:1,
                    ordersPrice:selectedProduct.productPrice,
                    productDtoFO:selectedProduct
                }
            ]);
            setShowCartList(true);
        }else{
            setAlertMessage("이미 담긴 상품입니다.");
            setAlertVisible(true);
        }
    };
    const updateOrders=(index,num)=>{
        setCart(prevCart=>
            prevCart.map((product,idx)=>
                idx===index ? {
                    ...product,
                    ordersEa:product.ordersEa+num,
                    ordersPrice:parseInt(product.productDtoFO.productPrice)*(product.ordersEa+num)
                } :product
            )
        );        
    }
    const submitOrder=()=>{
        if(ordersEndDate){
            setAlertMessage("발주 요청을 진행하시겠습니까?");
            setAlertVisible(true);
        }else{
            setAlertMessage("발주 마감일은 필수 선택사항입니다.");
            setAlertVisible(true);
        }
    }
    const handleAlertClose = (confirm) => {
        setAlertVisible(false);
        if (confirm) {
            axios.post('http://localhost:8080/order',{
                cart:cart,
                ordersApplyDate:new Date().toISOString().split("T")[0],
                ordersEndDate:ordersEndDate,
                branchCode:"B004"
            })
            .then(res=>{
                if(res){
                    setAlertMessage("발주 신청이 완료됐습니다.");
                    handleClose();
                }
            })
            .catch(err=>{
                setAlertMessage("!*발주 신청이 실패했습니다*!");
                setAlertVisible(true);
            })
        }
    };
    const CompareDate=(e)=>{
        setOrdersEndDate(e.target.value);        
    }
    useEffect(() => {
        const newTotal = cart.reduce(
            (total, product) => total + product.ordersPrice,
            0
        );
        setTotal(newTotal);
    }, [cart]);
    useEffect(()=>{
        getProductBCode();
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        setMinDate(formattedDate);
    },[]);
    if(!isLoading){
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>)
    }else if(error){
        return <Alert severity="error">{error.message}</Alert>;
    }else{
        return(
        <article>
            <InputGroup className="mb-3">
                <InputGroup.Text id="branchCode">지점코드</InputGroup.Text>
                <Form.Control
                readOnly
                placeholder="B004"
                aria-label="branchCode"
                aria-describedby="branchCode"
                />
            </InputGroup>
            <div>
                발주 마감일&nbsp;&nbsp;&nbsp;
                <input type='date' min={minDate} required onChange={CompareDate}></input>
            </div>
            <Form.Label htmlFor="productB">대분류</Form.Label>
            <InputGroup className="mb-3">
                <Form.Select defaultValue='' id="productB" onChange={showProducList}>
                    <option value="" disabled>상품 목록</option>
                    {blist.map((productB,index)=>
                            <option key={index} value={productB.productBCode}>{productB.productBName}</option>
                        )}
                </Form.Select>                
            </InputGroup>
            {showList&&
                <>
                <Form.Label htmlFor="product">상품목록</Form.Label>
                <InputGroup className="mb-3">
                    <Form.Select  defaultValue='' id="product" aria-label="Default select example" onChange={showCart}>
                        <option value="" disabled>상품목록</option>
                        {list.map((product,index)=>
                                <option key={index} value={JSON.stringify(product)}>{product.productName}</option>
                            )}
                    </Form.Select>                
                </InputGroup></>}

            <div>
                <span>발주목록</span>
                <div>
                    {showCartList&&
                    <ol>
                        {cart.map((product,index)=>
                            <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ flex: 3 }}>{product.productDtoFO.productName}</span>&nbsp;&nbsp;
                                <span style={{ flex: 1 }}>{product.productDtoFO.productPrice}원</span>&nbsp;&nbsp;
                                <span style={{ flex: 1 }}>{product.ordersEa}개</span>&nbsp;
                                <span style={{ flex: 1 }}>{product.productDtoFO.productPrice*product.ordersEa}개</span>&nbsp;
                                <button onClick={()=>{
                                    updateOrders(index,1);
                                }}>+</button>&nbsp;
                                <button onClick={()=>{
                                    if(product.ordersEa>1) updateOrders(index,-1);
                                }}>-</button>&nbsp;&nbsp;&nbsp;
                                <input type='number' min={1} placeholder='개수' style={{ width: '4em'}} onBlur={(e)=>{
                                    updateOrders(index,parseInt(e.target.value));
                                }}></input>&nbsp;&nbsp;&nbsp;
                                <button onClick={() =>
                                        setCart((prevCart) => prevCart.filter((_, idx) => idx !== index))
                                    }
                                >삭제</button>
                            </li>
                        )}
                    </ol>
                    }
                </div>
                <div>
                <Button variant="primary" onClick={submitOrder}>발주</Button>&nbsp;&nbsp;총 금액: {total}
                </div>                
            </div>
            {alertVisible && (
                <Alert
                    severity="info"
                    action={
                        <>
                            <Button variant="outlined" color="success" size="small" onClick={() => handleAlertClose(true)}>
                                확인
                            </Button>
                            <Button variant="outlined" color="error" size="small" onClick={() => handleAlertClose(false)}>
                                취소
                            </Button>
                        </>
                    }
                >
                    {alertMessage}
                </Alert>
            )}
        </article>
    );}
}